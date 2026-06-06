import type { Album, Song, Video } from "@features/library"

export interface SearchResult {
  songs: Song[]
  albums: Album[]
  videos: Video[]
}
