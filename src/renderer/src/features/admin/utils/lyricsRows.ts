import axios from "axios";
import type { LyricCue, LyricsRow } from "@features/lyrics";

export function rowsFromCues(japanese: LyricCue[], romaji: LyricCue[]): LyricsRow[] {
  return japanese.map((cue, index) => ({
    startMs: cue.startMs,
    endMs: cue.endMs,
    ja: cue.text,
    ...(romaji[index]?.text ? { romaji: romaji[index].text } : {})
  }));
}

export function cuesFromRows(rows: LyricsRow[]): LyricCue[] {
  return rows.map((row) => ({ startMs: row.startMs, endMs: row.endMs, text: row.ja }));
}

export function cloneRows(rows: LyricsRow[]): LyricsRow[] {
  return rows.map((row) => ({ ...row }));
}

export function errorMessage(value: unknown): string {
  if (axios.isAxiosError(value)) {
    const data = value.response?.data as { message?: string } | string | undefined;
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
  }
  return value instanceof Error ? value.message : String(value);
}
