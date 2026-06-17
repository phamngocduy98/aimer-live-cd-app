import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Album } from "@features/library";
import { usePlaybackGate } from "@features/auth";
import { getAlbum } from "../api/album";
import { albumDetailKey } from "./useAlbum";

export const usePlayAlbum = (): ((album: Album) => Promise<void>) => {
  const play = usePlaybackGate();
  const queryClient = useQueryClient();

  return useCallback(
    async (album: Album) => {
      const detail = await queryClient.fetchQuery({
        queryKey: albumDetailKey(album._id),
        queryFn: () => getAlbum(album._id)
      });

      if (detail.trackList.length === 0) return;

      play({
        items: detail.trackList,
        playFrom: {
          type: "album",
          id: detail._id,
          label: detail.title,
          route: `/album/${detail._id}`
        }
      });
    },
    [play, queryClient]
  );
};
