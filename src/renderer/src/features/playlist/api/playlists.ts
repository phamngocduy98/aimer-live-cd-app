import { apiClient } from "@lib/axios"
import type { Playlist, PlaylistDetail } from "../types"

export const listPlaylists = async (): Promise<Playlist[]> =>
  (await apiClient.get<Playlist[]>("/playlists")).data

export const getPlaylist = async (id: string): Promise<PlaylistDetail> =>
  (await apiClient.get<PlaylistDetail>(`/playlist/${id}`)).data

export const createPlaylist = async (data: {
  name: string
  description?: string
}): Promise<string> => (await apiClient.post<string>("/playlists", data)).data

export const updatePlaylist = async (
  id: string,
  data: { name?: string; description?: string }
): Promise<void> => {
  await apiClient.put(`/playlist/${id}`, data)
}

export const deletePlaylist = async (id: string): Promise<void> => {
  await apiClient.delete(`/playlist/${id}`)
}

export const addSongsToPlaylist = async (
  playlistId: string,
  songIds: string[]
): Promise<string> =>
  (await apiClient.post<string>(`/playlist/${playlistId}/songs`, { songIds })).data

export const removeSongFromPlaylist = async (
  playlistId: string,
  songId: string
): Promise<void> => {
  await apiClient.delete(`/playlist/${playlistId}/songs/${songId}`)
}
