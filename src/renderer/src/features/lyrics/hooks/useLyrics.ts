import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@lib/queryClient";
import { getLyrics, getLyricsProviders, saveLyricsRows } from "../api/lyrics";
import type { LyricLanguage, LyricMediaType, LyricProvenance, LyricsRow } from "../types";

export const lyricsKey = (mediaType: LyricMediaType, mediaId: string) =>
  ["lyrics", mediaType, mediaId] as const;

export function useLyrics(mediaType: LyricMediaType, mediaId?: string, enabled = true) {
  return useQuery({
    queryKey: lyricsKey(mediaType, mediaId ?? ""),
    queryFn: () => getLyrics(mediaType, mediaId!),
    enabled: enabled && Boolean(mediaId)
  });
}

export function useLyricsProviders() {
  return useQuery({ queryKey: ["lyrics", "providers"], queryFn: getLyricsProviders });
}

export function useSaveLyricsRows() {
  return useMutation({
    mutationFn: ({
      mediaType,
      mediaId,
      rows,
      provenance
    }: {
      mediaType: LyricMediaType;
      mediaId: string;
      rows: LyricsRow[];
      provenance: Partial<Record<LyricLanguage, LyricProvenance>>;
    }) => saveLyricsRows(mediaType, mediaId, rows, provenance),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: lyricsKey(variables.mediaType, variables.mediaId) })
  });
}
