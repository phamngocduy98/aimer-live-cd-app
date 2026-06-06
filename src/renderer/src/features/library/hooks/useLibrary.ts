import { useQuery } from "@tanstack/react-query"
import { listAlbums, listSongs, listVideos } from "../api/library"

export const libraryKeys = {
  albums: (page: number, pageSize: number) => ["library", "albums", page, pageSize] as const,
  songs: (page: number, pageSize: number) => ["library", "songs", page, pageSize] as const,
  videos: (page: number, pageSize: number) => ["library", "videos", page, pageSize] as const
}

export const useAlbums = (page = 0, pageSize = 30) =>
  useQuery({
    queryKey: libraryKeys.albums(page, pageSize),
    queryFn: () => listAlbums(page, pageSize)
  })

export const useSongs = (page = 0, pageSize = 50) =>
  useQuery({
    queryKey: libraryKeys.songs(page, pageSize),
    queryFn: () => listSongs(page, pageSize)
  })

export const useVideos = (page = 0, pageSize = 50) =>
  useQuery({
    queryKey: libraryKeys.videos(page, pageSize),
    queryFn: () => listVideos(page, pageSize)
  })
