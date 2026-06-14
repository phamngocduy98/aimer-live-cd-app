import type { Album, Song } from "@features/library"

export interface AlbumDetail extends Album {
  genre: string[]
  year: number
  trackList: Song[]
}
