import type { IVideo, IVideoChapter } from "../models/Video.js";

export interface SearchChapterResult<TVideo> {
  video: TVideo;
  chapterIndex: number;
  chapter: IVideoChapter;
}

export function findMatchingVideoChapters<TVideo extends Pick<IVideo, "chapters">>(
  videos: TVideo[],
  regex: RegExp,
  limit = 20
): SearchChapterResult<TVideo>[] {
  const matches: SearchChapterResult<TVideo>[] = [];

  for (const video of videos) {
    for (const [chapterIndex, chapter] of (video.chapters ?? []).entries()) {
      if (regex.test(chapter.title) || regex.test(chapter.subTitle ?? "")) {
        matches.push({ video, chapterIndex, chapter });
        if (matches.length >= limit) return matches;
      }
    }
  }

  return matches;
}
