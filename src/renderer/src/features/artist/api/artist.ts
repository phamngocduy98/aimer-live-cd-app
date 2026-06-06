import { apiClient } from "@lib/axios"
import type { Album, Song } from "@features/library"

export interface ArtistData {
  songs: Song[]
  albums: Album[]
}

export const getArtist = async (name: string): Promise<ArtistData> => {
  const [songs, albums] = await Promise.all([
    apiClient.get<Song[]>(`/artist/${name}/top-tracks`),
    apiClient.get<Album[]>("/albums", { params: { page: 0, pageSize: 100 } })
  ])
  return {
    songs: songs.data,
    albums: albums.data.filter((album) => album.artist === name)
  }
}
