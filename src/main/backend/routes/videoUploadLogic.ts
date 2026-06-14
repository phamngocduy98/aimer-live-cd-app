import type { IVideoChapter } from "../models/Video.js";
import { normalizeVideoChapters } from "../utils/videoLibrary.js";

export interface YoutubeVideoMetadata {
  title: string;
  artist: string[];
  year?: number;
  genre: string[];
  youtubeUrl: string;
  duration: number;
  chapters: IVideoChapter[];
}

function optionalNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
}

export function parseYoutubeVideoMetadata(value: unknown): YoutubeVideoMetadata {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("metadata field is required");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("metadata must be valid JSON");
  }

  const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
  const artist = stringArray(parsed.artists ?? parsed.artist);
  const youtubeUrl = typeof parsed.youtubeUrl === "string" ? parsed.youtubeUrl.trim() : "";
  const duration = optionalNumber(parsed.duration);
  const year = optionalNumber(parsed.year);
  const genre = stringArray(parsed.genres ?? parsed.genre);

  if (!title) throw new Error("title is required");
  if (artist.length === 0) throw new Error("artists must contain at least one artist");
  if (!/^https?:\/\//i.test(youtubeUrl)) throw new Error("youtubeUrl must be an HTTP URL");
  if (duration == null || duration < 0) throw new Error("duration must be a non-negative number");
  if (year != null && (!Number.isInteger(year) || year < 0)) {
    throw new Error("year must be a non-negative integer");
  }
  if (parsed.chapters != null && !Array.isArray(parsed.chapters)) {
    throw new Error("chapters must be an array");
  }

  const chapters = (parsed.chapters ?? []).map((chapter: any) => ({
    time: Number(chapter?.time),
    title: typeof chapter?.title === "string" ? chapter.title.trim() : "",
    subTitle: typeof chapter?.subTitle === "string" ? chapter.subTitle.trim() : ""
  }));
  if (
    chapters.some(
      (chapter) => !Number.isFinite(chapter.time) || chapter.time < 0 || !chapter.title
    )
  ) {
    throw new Error("chapters require a non-negative time and title");
  }

  return {
    title,
    artist,
    year,
    genre,
    youtubeUrl,
    duration,
    chapters: normalizeVideoChapters(title, chapters)
  };
}

export function validateImageUpload(file?: Express.Multer.File): void {
  if (file && !file.mimetype.startsWith("image/")) {
    throw new Error("cover must be an image");
  }
}
