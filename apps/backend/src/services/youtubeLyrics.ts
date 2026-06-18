import type { Types } from "mongoose";
import {
  Lyrics,
  type ILyricCue,
  type ILyricsRow,
  type LyricLanguage,
  type LyricSource
} from "../models/Lyrics.js";
import { validateCues, validateLyricsRows } from "../routes/lyricsLogic.js";
import type { YoutubeSubtitleTrack } from "./youtubeMetadata.js";
import { romanizeCues } from "./lyrics/romanize.js";

const CAPTION_TIMEOUT_MS = 10_000;

type CaptionLanguage = "ja" | "en" | "vi";

export type YoutubeLyricsPreview = {
  rows: ILyricsRow[];
  provenance: Partial<Record<LyricLanguage, { source: LyricSource; providerId?: string }>>;
};

function languageKey(language: string): CaptionLanguage | undefined {
  const normalized = language.toLowerCase();
  if (normalized === "ja" || normalized.startsWith("ja-")) return "ja";
  if (normalized === "en" || normalized.startsWith("en-")) return "en";
  if (normalized === "vi" || normalized.startsWith("vi-")) return "vi";
  return undefined;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function parseVttTimestamp(value: string): number {
  const match = /^(?:(\d{1,2}):)?(\d{2}):(\d{2})\.(\d{3})$/.exec(value.trim());
  if (!match) throw new Error(`Invalid VTT timestamp: ${value.trim()}`);
  const hours = match[1] ? Number(match[1]) : 0;
  return hours * 3_600_000 + Number(match[2]) * 60_000 + Number(match[3]) * 1000 + Number(match[4]);
}

export function parseWebVtt(input: string): ILyricCue[] {
  const cues: ILyricCue[] = [];
  const blocks = input
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/);

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const timingIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingIndex < 0) continue;

    const timingMatch = /^(.+?)\s*-->\s*(.+?)(?:\s+.*)?$/.exec(lines[timingIndex]);
    if (!timingMatch) continue;
    const text = lines
      .slice(timingIndex + 1)
      .join("\n")
      .replace(/<[^>]+>/g, "")
      .trim();
    if (!text) continue;
    cues.push({
      startMs: parseVttTimestamp(timingMatch[1]),
      endMs: parseVttTimestamp(timingMatch[2]),
      text: decodeEntities(text)
    });
  }

  return validateCues(cues);
}

function pickCaptionTracks(
  subtitles: YoutubeSubtitleTrack[]
): Partial<Record<CaptionLanguage, YoutubeSubtitleTrack>> {
  const picked: Partial<Record<CaptionLanguage, YoutubeSubtitleTrack>> = {};
  for (const subtitle of subtitles) {
    if (!subtitle.url) continue;
    const key = languageKey(subtitle.language);
    if (!key) continue;
    const current = picked[key];
    if (!current || subtitle.ext === "vtt" || current.automatic) picked[key] = subtitle;
  }
  return picked;
}

async function fetchCaption(
  subtitle: YoutubeSubtitleTrack | undefined
): Promise<ILyricCue[] | undefined> {
  if (!subtitle?.url) return undefined;
  const response = await fetch(subtitle.url, { signal: AbortSignal.timeout(CAPTION_TIMEOUT_MS) });
  if (!response.ok)
    throw new Error(`Caption ${subtitle.language} failed with status ${response.status}`);
  return parseWebVtt(await response.text());
}

function bestCueText(cues: ILyricCue[] | undefined, target: ILyricCue): string | undefined {
  if (!cues?.length) return undefined;
  const midpoint = (target.startMs + target.endMs) / 2;
  const containing = cues.find((cue) => cue.startMs <= midpoint && cue.endMs >= midpoint);
  if (containing) return containing.text;
  let best: { overlap: number; text: string } | undefined;
  for (const cue of cues) {
    const overlap = Math.min(target.endMs, cue.endMs) - Math.max(target.startMs, cue.startMs);
    if (overlap > 0 && (!best || overlap > best.overlap)) best = { overlap, text: cue.text };
  }
  return best?.text;
}

export async function importYoutubeSubtitleLyrics(
  mediaId: Types.ObjectId,
  subtitles: YoutubeSubtitleTrack[]
): Promise<ILyricsRow[] | null> {
  const preview = await previewYoutubeSubtitleLyrics(subtitles);
  if (!preview) return null;

  await Lyrics.findOneAndUpdate(
    { mediaType: "video", mediaId },
    {
      $set: {
        rows: preview.rows,
        provenance: Object.fromEntries(
          Object.entries(preview.provenance).map(([language, provenance]) => [
            language,
            { ...provenance, generatedAt: new Date() }
          ])
        )
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return preview.rows;
}

export async function previewYoutubeSubtitleLyrics(
  subtitles: YoutubeSubtitleTrack[]
): Promise<YoutubeLyricsPreview | null> {
  const tracks = pickCaptionTracks(subtitles);
  if (!tracks.ja) return null;

  const [ja, en, vi] = await Promise.all([
    fetchCaption(tracks.ja),
    fetchCaption(tracks.en),
    fetchCaption(tracks.vi)
  ]);
  if (!ja?.length) return null;

  const romaji = await romanizeCues(ja);
  const rows = validateLyricsRows(
    ja.map((cue, index) => ({
      startMs: cue.startMs,
      endMs: cue.endMs,
      ja: cue.text,
      ...(romaji[index]?.text ? { romaji: romaji[index].text } : {}),
      ...(bestCueText(en, cue) ? { en: bestCueText(en, cue) } : {}),
      ...(bestCueText(vi, cue) ? { vi: bestCueText(vi, cue) } : {})
    }))
  );

  return {
    rows,
    provenance: {
      ja: { source: "youtube", providerId: tracks.ja.language },
      romaji: { source: "kuroshiro" },
      ...(en?.length ? { en: { source: "youtube", providerId: tracks.en?.language } } : {}),
      ...(vi?.length ? { vi: { source: "youtube", providerId: tracks.vi?.language } } : {})
    }
  };
}
