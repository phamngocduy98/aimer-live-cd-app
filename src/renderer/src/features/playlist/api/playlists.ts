import { apiClient } from "@lib/axios";
import type { Playlist, PlaylistDetail, PlaylistItemInput } from "../types";

interface ApiSuccess<T> {
  status: "success";
  message: T;
}

export const listPlaylists = async (): Promise<Playlist[]> =>
  (await apiClient.get<Playlist[]>("/playlists")).data;

export const getPlaylist = async (id: string): Promise<PlaylistDetail> =>
  (await apiClient.get<PlaylistDetail>(`/playlist/${id}`)).data;

export const createPlaylist = async (data: {
  name: string;
  description?: string;
}): Promise<string> => (await apiClient.post<ApiSuccess<string>>("/playlists", data)).data.message;

export const updatePlaylist = async (
  id: string,
  data: { name?: string; description?: string }
): Promise<void> => {
  await apiClient.put(`/playlist/${id}`, data);
};

export const deletePlaylist = async (id: string): Promise<void> => {
  await apiClient.delete(`/playlist/${id}`);
};

export const addSongsToPlaylist = async (playlistId: string, songIds: string[]): Promise<string> =>
  (
    await apiClient.post<ApiSuccess<string>>(`/playlist/${playlistId}/songs`, {
      songIds
    })
  ).data.message;

export const removeSongFromPlaylist = async (playlistId: string, songId: string): Promise<void> => {
  await apiClient.delete(`/playlist/${playlistId}/songs/${songId}`);
};

export const addItemsToPlaylist = async (
  playlistId: string,
  items: PlaylistItemInput[],
  allowDuplicates = false
): Promise<string> =>
  (
    await apiClient.post<ApiSuccess<string>>(`/playlist/${playlistId}/items`, {
      items,
      allowDuplicates
    })
  ).data.message;

export const removeItemFromPlaylist = async (playlistId: string, itemId: string): Promise<void> => {
  await apiClient.delete(`/playlist/${playlistId}/items/${itemId}`);
};
