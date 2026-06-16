import type { Album, IVideoChapter, Song, Video } from "@features/library"

export interface SearchChapterResult {
  video: Video
  chapterIndex: number
  chapter: IVideoChapter
}

export interface SearchResult {
  songs: Song[]
  albums: Album[]
  videos: Video[]
  chapters: SearchChapterResult[]
}
