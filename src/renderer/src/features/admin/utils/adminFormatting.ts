import type { AdminVideo } from "../types";

export function joinArtists(artists?: string[]): string {
  return artists?.join(", ") || "";
}

export function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseChapterTime(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  const parts = trimmed.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

export function parseChapterCsv(text: string): AdminVideo["chapters"] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [time = "0", title = "", subTitle = ""] = line.split(",").map((cell) => cell.trim());
      return { time: parseChapterTime(time), title, subTitle };
    });
}
