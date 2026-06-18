import type { IVideoChapter } from "../models/Video.js";

export function defaultVideoChapter(title: string): IVideoChapter {
  return { time: 0, title, subTitle: "" };
}

export function normalizeVideoChapters(
  title: string,
  chapters: IVideoChapter[] | undefined | null
): IVideoChapter[] {
  if (!Array.isArray(chapters) || chapters.length === 0) {
    return [defaultVideoChapter(title)];
  }
  return chapters;
}

export function syncDefaultVideoChapterTitle(
  previousTitle: string,
  nextTitle: string,
  chapters: IVideoChapter[] | undefined | null
): IVideoChapter[] {
  const normalized = normalizeVideoChapters(nextTitle, chapters);
  if (
    normalized.length === 1 &&
    normalized[0].time === 0 &&
    normalized[0].title === previousTitle &&
    !normalized[0].subTitle
  ) {
    return [defaultVideoChapter(nextTitle)];
  }
  return normalized;
}

export interface LegacyVideoAlbumMetadata {
  cover?: Buffer;
  year?: number;
  genre?: string[];
}

export interface LegacyVideoMetadata {
  cover?: Buffer;
  year?: number;
  genre?: string[];
}

export function inheritVideoAlbumMetadata(
  video: LegacyVideoMetadata,
  album?: LegacyVideoAlbumMetadata | null
): LegacyVideoMetadata {
  if (!album) return { ...video };
  return {
    ...video,
    cover: video.cover ?? album.cover,
    year: video.year ?? album.year,
    genre: video.genre?.length ? video.genre : (album.genre ?? [])
  };
}
