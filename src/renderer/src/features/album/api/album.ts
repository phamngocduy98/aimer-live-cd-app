import { apiClient } from "@lib/axios"
import type { AlbumDetail } from "../types"

export const getAlbum = async (id: string): Promise<AlbumDetail> => {
  const album = (await apiClient.get<AlbumDetail>(`/album/${id}`)).data
  const summary = {
    _id: album._id,
    artist: album.artist,
    title: album.title,
    cover: album.cover,
    year: album.year
  }
  album.trackList.forEach((track) => {
    track.album = summary
  })
  return album
}
