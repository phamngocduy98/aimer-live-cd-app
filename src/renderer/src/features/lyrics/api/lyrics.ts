import axios from "axios";
import { apiClient } from "@lib/axios";
import type {
  LyricCue,
  LyricLanguage,
  LyricMediaType,
  LyricProvenance,
  LyricsCandidate,
  LyricsDocument,
  LyricsRow,
  TranslationProvider
} from "../types";

export async function getLyrics(
  mediaType: LyricMediaType,
  mediaId: string
): Promise<LyricsDocument | null> {
  try {
    return (await apiClient.get<LyricsDocument>(`/lyrics/${mediaType}/${mediaId}`)).data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

export async function getLyricsProviders(): Promise<{
  lyrics: string[];
  translation: TranslationProvider[];
}> {
  return (await apiClient.get("/admin/lyrics/providers")).data;
}

export async function previewSrt(file: File): Promise<LyricCue[]> {
  const form = new FormData();
  form.append("subtitle", file);
  return (await apiClient.post<{ cues: LyricCue[] }>("/admin/lyrics/preview-srt", form)).data.cues;
}

export async function searchExternalLyrics(
  mediaType: LyricMediaType,
  mediaId: string,
  query: {
    trackName: string;
    artistName: string;
    albumName?: string;
    duration?: number;
  }
): Promise<LyricsCandidate[]> {
  return (
    await apiClient.post<LyricsCandidate[]>(`/admin/lyrics/${mediaType}/${mediaId}/search`, query)
  ).data;
}

export async function importExternalLyrics(
  mediaType: LyricMediaType,
  mediaId: string,
  candidateId: number,
  duration?: number
): Promise<{
  rows: LyricsRow[];
  provenance: Pick<Record<LyricLanguage, LyricProvenance>, "ja" | "romaji">;
  candidate: LyricsCandidate;
}> {
  return (
    await apiClient.post(`/admin/lyrics/${mediaType}/${mediaId}/import`, {
      candidateId,
      duration
    })
  ).data;
}

export async function generateRomaji(cues: LyricCue[]): Promise<LyricCue[]> {
  return (await apiClient.post<{ cues: LyricCue[] }>("/admin/lyrics/romanize", { cues })).data.cues;
}

export async function translateLyrics(
  cues: LyricCue[],
  target: "en" | "vi",
  provider: TranslationProvider
): Promise<{ cues: LyricCue[]; source: TranslationProvider }> {
  return (await apiClient.post("/admin/lyrics/translate", { cues, target, provider })).data;
}

export async function saveLyricsRows(
  mediaType: LyricMediaType,
  mediaId: string,
  rows: LyricsRow[],
  provenance: Partial<Record<LyricLanguage, LyricProvenance>>
): Promise<LyricsDocument> {
  return (
    await apiClient.put<LyricsDocument>(`/admin/lyrics/${mediaType}/${mediaId}/tracks`, {
      rows,
      provenance
    })
  ).data;
}
