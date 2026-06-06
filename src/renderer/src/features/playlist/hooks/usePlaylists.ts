import { useMutation, useQuery } from "@tanstack/react-query"
import { queryClient } from "@lib/queryClient"
import {
  addSongsToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylist,
  removeSongFromPlaylist,
  updatePlaylist
} from "../api/playlists"
import { listPlaylists } from "../api/playlists"

export const playlistKeys = {
  all: ["playlists"] as const,
  detail: (id: string) => ["playlists", "detail", id] as const
}

export const usePlaylists = () =>
  useQuery({ queryKey: playlistKeys.all, queryFn: listPlaylists })

export const usePlaylist = (id: string) =>
  useQuery({
    queryKey: playlistKeys.detail(id),
    queryFn: () => getPlaylist(id),
    enabled: Boolean(id)
  })

export const useCreatePlaylist = () =>
  useMutation({
    mutationFn: createPlaylist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: playlistKeys.all })
  })

export const useUpdatePlaylist = () =>
  useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) =>
      updatePlaylist(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.all })
      queryClient.invalidateQueries({ queryKey: playlistKeys.detail(id) })
    }
  })

export const useDeletePlaylist = () =>
  useMutation({
    mutationFn: deletePlaylist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: playlistKeys.all })
  })

export const useAddSongsToPlaylist = () =>
  useMutation({
    mutationFn: ({ playlistId, songIds }: { playlistId: string; songIds: string[] }) =>
      addSongsToPlaylist(playlistId, songIds),
    onSuccess: (_data, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.all })
      queryClient.invalidateQueries({ queryKey: playlistKeys.detail(playlistId) })
    }
  })

export const useRemoveSongFromPlaylist = () =>
  useMutation({
    mutationFn: ({ playlistId, songId }: { playlistId: string; songId: string }) =>
      removeSongFromPlaylist(playlistId, songId),
    onSuccess: (_data, { playlistId }) =>
      queryClient.invalidateQueries({ queryKey: playlistKeys.detail(playlistId) })
  })
