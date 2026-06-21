import { useMutation, useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@app/hooks";
import { queryClient } from "@lib/queryClient";
import {
  addSongsToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylist,
  removeSongFromPlaylist,
  updatePlaylist
} from "../api/playlists";
import { addItemsToPlaylist, removeItemFromPlaylist } from "../api/playlists";
import type { PlaylistItemInput } from "../types";
import { listPlaylists } from "../api/playlists";

export const playlistKeys = {
  all: ["playlists"] as const,
  list: (userId: string) => ["playlists", "list", userId] as const,
  detail: (userId: string, id: string) => ["playlists", "detail", userId, id] as const
};

function usePlaylistUserId() {
  return useAppSelector((state) => state.auth.session.user?._id ?? "");
}

export const usePlaylists = () => {
  const userId = usePlaylistUserId();
  return useQuery({
    queryKey: playlistKeys.list(userId),
    queryFn: listPlaylists,
    enabled: Boolean(userId)
  });
};

export const usePlaylist = (id: string) => {
  const userId = usePlaylistUserId();
  return useQuery({
    queryKey: playlistKeys.detail(userId, id),
    queryFn: () => getPlaylist(id),
    enabled: Boolean(id && userId)
  });
};

export const useCreatePlaylist = () =>
  useMutation({
    mutationFn: createPlaylist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: playlistKeys.all })
  });

export const useUpdatePlaylist = () =>
  useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) =>
      updatePlaylist(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.all });
      queryClient.invalidateQueries({ queryKey: ["playlists", "detail"] });
    }
  });

export const useDeletePlaylist = () =>
  useMutation({
    mutationFn: deletePlaylist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: playlistKeys.all })
  });

export const useAddSongsToPlaylist = () =>
  useMutation({
    mutationFn: ({ playlistId, songIds }: { playlistId: string; songIds: string[] }) =>
      addSongsToPlaylist(playlistId, songIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.all });
      queryClient.invalidateQueries({ queryKey: ["playlists", "detail"] });
    }
  });

export const useRemoveSongFromPlaylist = () =>
  useMutation({
    mutationFn: ({ playlistId, songId }: { playlistId: string; songId: string }) =>
      removeSongFromPlaylist(playlistId, songId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["playlists", "detail"] })
  });

export const useAddItemsToPlaylist = () =>
  useMutation({
    mutationFn: ({
      playlistId,
      items,
      allowDuplicates
    }: {
      playlistId: string;
      items: PlaylistItemInput[];
      allowDuplicates?: boolean;
    }) => addItemsToPlaylist(playlistId, items, allowDuplicates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playlistKeys.all });
      queryClient.invalidateQueries({ queryKey: ["playlists", "detail"] });
    }
  });

export const useRemoveItemFromPlaylist = () =>
  useMutation({
    mutationFn: ({ playlistId, itemId }: { playlistId: string; itemId: string }) =>
      removeItemFromPlaylist(playlistId, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["playlists", "detail"] })
  });
