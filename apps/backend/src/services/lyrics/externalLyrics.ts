import type { ILyricCue } from "../../models/Lyrics.js";
import { parseLrc } from "../../routes/lyricsLogic.js";

const LRCLIB_BASE = "https://lrclib.net/api";
const USER_AGENT = "node-music-stream-app/1.0 (non-commercial lyrics administration)";
const REQUEST_TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 250;

export interface LyricsSearchInput {
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
}

export interface LyricsCandidate {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  synchronized: boolean;
}

interface LrclibRecord extends LyricsCandidate {
  syncedLyrics?: string | null;
}

function trimmed(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

class LrclibRequestError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean
  ) {
    super(message);
  }
}

async function requestJson<T>(url: URL, maxAttempts = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      if (response.status === 429) {
        throw new LrclibRequestError("LRCLIB rate limit reached", false);
      }
      if (response.status >= 500) {
        throw new LrclibRequestError(`LRCLIB service failed with status ${response.status}`, true);
      }
      if (!response.ok) {
        throw new LrclibRequestError(`LRCLIB request failed with status ${response.status}`, false);
      }
      return (await response.json()) as T;
    } catch (error) {
      const classified = classifyRequestError(error);
      lastError = classified;
      if (!classified.retryable || attempt === maxAttempts - 1) throw classified;
      await delay(RETRY_DELAY_MS);
    }
  }
  throw lastError;
}

function classifyRequestError(error: unknown): LrclibRequestError {
  if (error instanceof LrclibRequestError) return error;
  if (
    error instanceof Error &&
    (error.name === "TimeoutError" ||
      error.name === "AbortError" ||
      /aborted due to timeout/i.test(error.message))
  ) {
    return new LrclibRequestError("LRCLIB request timed out after 30 seconds", true);
  }
  return new LrclibRequestError(
    `LRCLIB network request failed: ${error instanceof Error ? error.message : String(error)}`,
    true
  );
}

function delay(milliseconds: number): Promise<void> {
  if (process.env.NODE_ENV === "test") return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function normalizeLrclibRecord(record: any): LyricsCandidate {
  return {
    id: Number(record.id),
    trackName: trimmed(record.trackName, 200),
    artistName: trimmed(record.artistName, 200),
    albumName: trimmed(record.albumName, 200),
    duration: Number(record.duration) || 0,
    instrumental: Boolean(record.instrumental),
    synchronized: typeof record.syncedLyrics === "string" && record.syncedLyrics.trim().length > 0
  };
}

export function sortCandidatesByDuration(
  candidates: LyricsCandidate[],
  duration?: number
): LyricsCandidate[] {
  return duration
    ? [...candidates].sort(
        (left, right) => Math.abs(left.duration - duration) - Math.abs(right.duration - duration)
      )
    : candidates;
}

export async function searchLrclib(input: LyricsSearchInput): Promise<LyricsCandidate[]> {
  if (process.env.E2E_TEST_MODE === "true") {
    return [
      {
        id: 9001,
        trackName: input.trackName,
        artistName: input.artistName,
        albumName: input.albumName ?? "",
        duration: input.duration ?? 0,
        instrumental: false,
        synchronized: true
      }
    ];
  }

  const trackName = trimmed(input.trackName, 200);
  const artistName = trimmed(input.artistName, 200);
  if (!trackName || !artistName) throw new Error("Track name and artist are required");
  const url = new URL(`${LRCLIB_BASE}/search`);
  url.searchParams.set("track_name", trackName);
  url.searchParams.set("artist_name", artistName);
  if (input.albumName) url.searchParams.set("album_name", trimmed(input.albumName, 200));
  let records: any[];
  if (input.albumName) {
    try {
      records = await requestJson<any[]>(url, 1);
    } catch (error) {
      if (!(error instanceof LrclibRequestError) || !error.retryable) throw error;
      url.searchParams.delete("album_name");
      records = await requestJson<any[]>(url, 1);
    }
  } else {
    records = await requestJson<any[]>(url);
  }
  const candidates = records.slice(0, 20).map(normalizeLrclibRecord);
  return sortCandidatesByDuration(candidates, input.duration);
}

export async function loadLrclibCandidate(
  id: number,
  duration?: number
): Promise<{ cues: ILyricCue[]; candidate: LyricsCandidate }> {
  if (process.env.E2E_TEST_MODE === "true" && id === 9001) {
    return {
      candidate: {
        id,
        trackName: "E2E Imported Lyrics",
        artistName: "E2E Artist",
        albumName: "E2E Album Alpha",
        duration: duration ?? 5,
        instrumental: false,
        synchronized: true
      },
      cues: parseLrc("[00:00.00]最初の自動歌詞\n[00:02.50]次の自動歌詞", duration)
    };
  }

  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid LRCLIB record id");
  const record = await requestJson<LrclibRecord>(new URL(`${LRCLIB_BASE}/get/${id}`));
  const candidate = normalizeLrclibRecord(record);
  if (candidate.instrumental) throw new Error("The selected LRCLIB record is instrumental");
  if (!candidate.synchronized || !record.syncedLyrics) {
    throw new Error("The selected LRCLIB record has no synchronized lyrics");
  }
  return { candidate, cues: parseLrc(record.syncedLyrics, duration || candidate.duration) };
}
