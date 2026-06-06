import { apiClient } from "@lib/axios"
import type { Album, Song, Video } from "../types"

export const listAlbums = async (page = 0, pageSize = 30): Promise<Album[]> =>
  (await apiClient.get<Album[]>("/albums", { params: { page, pageSize } })).data

export const listSongs = async (page = 0, pageSize = 50): Promise<Song[]> =>
  (await apiClient.get<Song[]>("/songs", { params: { page, pageSize } })).data

export const listVideos = async (page = 0, pageSize = 50): Promise<Video[]> =>
  (await apiClient.get<Video[]>("/videos", { params: { page, pageSize } })).data
