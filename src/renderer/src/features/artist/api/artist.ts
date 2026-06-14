import { apiClient } from "@lib/axios"
import type { Album, Song, Video } from "@features/library"

export interface ArtistData {
  songs: Song[]
  albums: Album[]
  videos: Video[]
}

export const getArtist = async (name: string): Promise<ArtistData> => {
  const [songs, albums, videos] = await Promise.all([
    apiClient.get<Song[]>(`/artist/${name}/top-tracks`),
    apiClient.get<Album[]>("/albums", { params: { page: 0, pageSize: 100 } }),
    apiClient.get<Video[]>(`/artist/${name}/videos`)
  ])
  return {
    songs: songs.data,
    albums: albums.data.filter((album) => album.artist === name),
    videos: videos.data
  }
}
