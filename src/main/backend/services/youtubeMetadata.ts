import { execFile } from "node:child_process";
import type { IVideoChapter } from "../models/Video.js";
import { detectImageMimeType } from "../utils/imageMime.js";
import { normalizeVideoChapters } from "../utils/videoLibrary.js";

const YT_DLP_TIMEOUT_MS = 30_000;
const YT_DLP_MAX_BUFFER = 5 * 1024 * 1024;
const TIMESTAMP_LINE = /(?:(?:^|\s)(\d{1,2}:)?\d{1,2}:\d{2}(?:\.\d{1,3})?)(?:\s*[-–—]\s*|\s+)(.+)$/;

export interface YoutubeMetadataPreview {
  title: string;
  artists: string[];
  youtubeUrl: string;
  duration: number;
  videoCodecRaw?: string;
  audioCodecRaw?: string;
  audioSampleRate?: number;
  bitrate?: number;
  fileExtension?: string;
  chapters: IVideoChapter[];
  subtitles: YoutubeSubtitleTrack[];
  cover?: {
    mimeType: string;
    base64: string;
  };
}

export interface YoutubeSubtitleTrack {
  language: string;
  name?: string;
  ext?: string;
  url?: string;
  automatic?: boolean;
}

interface YtDlpChapter {
  start_time?: number;
  title?: string;
}

interface YtDlpOutput {
  title?: string;
  uploader?: string;
  channel?: string;
  webpage_url?: string;
  original_url?: string;
  duration?: number;
  vcodec?: string;
  acodec?: string;
  asr?: number;
  abr?: number;
  tbr?: number;
  vbr?: number;
  ext?: string;
  thumbnail?: string;
  description?: string;
  chapters?: YtDlpChapter[];
  subtitles?: Record<string, YtDlpSubtitle[]>;
  automatic_captions?: Record<string, YtDlpSubtitle[]>;
}

interface YtDlpSubtitle {
  ext?: string;
  url?: string;
  name?: string;
}

interface ExecFileFailure extends Error {
  code?: string;
  killed?: boolean;
  signal?: string;
  stderr?: string | Buffer;
}

function ytDlpExecutable(): string {
  return process.env.YT_DLP_PATH?.trim() || "yt-dlp";
}

function assertYoutubeUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new Error("youtubeUrl is required");
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("youtubeUrl must be a valid URL");
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (!["youtube.com", "music.youtube.com", "youtu.be"].includes(host)) {
    throw new Error("youtubeUrl must be a YouTube URL");
  }
  return url.toString();
}

function parseTimestamp(value: string): number | undefined {
  const match = value.match(/\b(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\.\d{1,3})?\b/);
  if (!match) return undefined;
  const hours = match[1] ? Number(match[1]) : 0;
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  if (minutes > 59 || seconds > 59) return undefined;
  return hours * 3600 + minutes * 60 + seconds;
}

function parseDescriptionChapters(description: string | undefined): IVideoChapter[] {
  if (!description) return [];
  const chapters: IVideoChapter[] = [];
  for (const line of description.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const time = parseTimestamp(trimmed);
    const title = trimmed.match(TIMESTAMP_LINE)?.[2]?.trim();
    if (time == null || !title) continue;
    chapters.push({ time, title, subTitle: "" });
  }
  return chapters;
}

function optionalPositiveNumber(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function optionalCodec(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const codec = value.trim();
  return codec && codec !== "none" ? codec : undefined;
}

function bitrateFromYtDlp(parsed: YtDlpOutput): number | undefined {
  const kbps = optionalPositiveNumber(parsed.tbr ?? parsed.abr ?? parsed.vbr);
  return kbps == null ? undefined : Math.round(kbps * 1000);
}

function normalizeSubtitles(
  subtitles: Record<string, YtDlpSubtitle[]> | undefined,
  automatic: boolean
): YoutubeSubtitleTrack[] {
  if (!subtitles) return [];
  return Object.entries(subtitles).flatMap(([language, tracks]) => {
    const track =
      tracks.find((item) => item.url && item.ext === "vtt") ??
      tracks.find((item) => item.url) ??
      tracks[0];
    if (!track) return [];
    return [
      {
        language,
        name: track.name,
        ext: track.ext,
        url: track.url,
        automatic
      }
    ];
  });
}

function normalizeYtDlpOutput(
  raw: string,
  requestedUrl: string
): Omit<YoutubeMetadataPreview, "cover"> & {
  thumbnail?: string;
} {
  let parsed: YtDlpOutput;
  try {
    parsed = JSON.parse(raw) as YtDlpOutput;
  } catch {
    throw new Error("yt-dlp returned invalid metadata");
  }

  const title = parsed.title?.trim();
  const artist = (parsed.channel || parsed.uploader || "").trim();
  const duration = Number(parsed.duration);
  if (!title) throw new Error("yt-dlp did not return a title");
  if (!artist) throw new Error("yt-dlp did not return a channel name");
  if (!Number.isFinite(duration) || duration < 0)
    throw new Error("yt-dlp did not return a valid duration");

  const chapters =
    parsed.chapters
      ?.map((chapter) => ({
        time: Number(chapter.start_time),
        title: chapter.title?.trim() || "",
        subTitle: ""
      }))
      .filter((chapter) => Number.isFinite(chapter.time) && chapter.time >= 0 && chapter.title) ??
    [];

  return {
    title,
    artists: [artist],
    youtubeUrl: parsed.webpage_url || parsed.original_url || requestedUrl,
    duration,
    videoCodecRaw: optionalCodec(parsed.vcodec),
    audioCodecRaw: optionalCodec(parsed.acodec),
    audioSampleRate: optionalPositiveNumber(parsed.asr),
    bitrate: bitrateFromYtDlp(parsed),
    fileExtension:
      typeof parsed.ext === "string" && parsed.ext.trim() ? parsed.ext.trim() : undefined,
    chapters: normalizeVideoChapters(
      title,
      chapters.length ? chapters : parseDescriptionChapters(parsed.description)
    ),
    subtitles: [
      ...normalizeSubtitles(parsed.subtitles, false),
      ...normalizeSubtitles(parsed.automatic_captions, true)
    ],
    thumbnail: parsed.thumbnail
  };
}

async function fetchCover(thumbnail: string | undefined): Promise<YoutubeMetadataPreview["cover"]> {
  if (!thumbnail) return undefined;
  try {
    const response = await fetch(thumbnail, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return undefined;
    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = detectImageMimeType(buffer);
    if (!mimeType) return undefined;
    return { mimeType, base64: buffer.toString("base64") };
  } catch {
    return undefined;
  }
}

export async function fetchYoutubeMetadataPreview(value: unknown): Promise<YoutubeMetadataPreview> {
  const youtubeUrl = assertYoutubeUrl(value);
  let stdout: string;
  try {
    stdout = await new Promise<string>((resolve, reject) => {
      execFile(
        ytDlpExecutable(),
        ["--dump-single-json", "--skip-download", "--no-playlist", youtubeUrl],
        {
          timeout: YT_DLP_TIMEOUT_MS,
          maxBuffer: YT_DLP_MAX_BUFFER,
          windowsHide: true
        },
        (error, childStdout, childStderr) => {
          if (error) {
            reject(Object.assign(error, { stderr: childStderr }));
            return;
          }
          resolve(childStdout.toString());
        }
      );
    });
  } catch (error) {
    const execError = error as ExecFileFailure;
    if (execError.code === "ENOENT") {
      throw new Error("yt-dlp was not found. Set YT_DLP_PATH or add yt-dlp to PATH.");
    }
    if (execError.killed || execError.signal === "SIGTERM") {
      throw new Error("yt-dlp timed out while loading YouTube metadata.");
    }
    throw new Error(execError.stderr?.toString().trim() || execError.message || "yt-dlp failed");
  }

  const metadata = normalizeYtDlpOutput(stdout, youtubeUrl);
  return {
    title: metadata.title,
    artists: metadata.artists,
    youtubeUrl: metadata.youtubeUrl,
    duration: metadata.duration,
    videoCodecRaw: metadata.videoCodecRaw,
    audioCodecRaw: metadata.audioCodecRaw,
    audioSampleRate: metadata.audioSampleRate,
    bitrate: metadata.bitrate,
    fileExtension: metadata.fileExtension,
    chapters: metadata.chapters,
    subtitles: metadata.subtitles,
    cover: await fetchCover(metadata.thumbnail)
  };
}
