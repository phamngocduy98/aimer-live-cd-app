import type { Album, Song, Video } from "@features/library"

export interface AlbumDetail extends Album {
  genre: string[]
  year: number
  trackList: Song[]
  videoList: Video[]
}
