import type { ILyricCue, ILyricsRow } from "../models/Lyrics.js";

const TIMESTAMP = /^(\d{2,}):([0-5]\d):([0-5]\d)[,.](\d{3})$/;

function parseTimestamp(value: string): number {
  const match = TIMESTAMP.exec(value.trim());
  if (!match) throw new Error(`Invalid SRT timestamp: ${value.trim()}`);
  const [, hours, minutes, seconds, milliseconds] = match;
  return (
    Number(hours) * 3_600_000 +
    Number(minutes) * 60_000 +
    Number(seconds) * 1000 +
    Number(milliseconds)
  );
}

export function parseSrt(input: string): ILyricCue[] {
  const normalized = input
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .trim();
  if (!normalized) throw new Error("Subtitle file is empty");

  const cues = normalized.split(/\n{2,}/).map((block, blockIndex) => {
    const lines = block.split("\n");
    if (/^\d+$/.test(lines[0]?.trim() ?? "")) lines.shift();
    const timing = lines.shift()?.trim() ?? "";
    const timingMatch = /^(.+?)\s*-->\s*(.+?)(?:\s+.*)?$/.exec(timing);
    if (!timingMatch) throw new Error(`Invalid SRT timing at cue ${blockIndex + 1}`);

    const startMs = parseTimestamp(timingMatch[1]);
    const endMs = parseTimestamp(timingMatch[2]);
    const text = lines.join("\n").trim();
    if (!text) throw new Error(`Cue ${blockIndex + 1} has no text`);
    if (endMs <= startMs) throw new Error(`Cue ${blockIndex + 1} must end after it starts`);
    return { startMs, endMs, text };
  });

  cues.forEach((cue, index) => {
    if (index > 0 && cue.startMs < cues[index - 1].startMs) {
      throw new Error(`Cue ${index + 1} starts before the previous cue`);
    }
  });
  return cues;
}

const LRC_TIMESTAMP = /^\[(\d{1,3}):([0-5]\d)(?:[.:](\d{1,3}))?\]\s*(.*)$/;

export function parseLrc(input: string, durationSeconds?: number): ILyricCue[] {
  const starts = input
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .flatMap((line) => {
      const match = LRC_TIMESTAMP.exec(line.trim());
      if (!match) return [];
      const fraction = (match[3] ?? "0").padEnd(3, "0").slice(0, 3);
      return [
        {
          startMs: Number(match[1]) * 60_000 + Number(match[2]) * 1000 + Number(fraction),
          text: match[4].trim()
        }
      ];
    })
    .filter((cue) => cue.text.length > 0);

  if (starts.length === 0) throw new Error("Provider result has no synchronized lyric cues");
  starts.forEach((cue, index) => {
    if (index > 0 && cue.startMs <= starts[index - 1].startMs) {
      throw new Error(`Lyric cue ${index + 1} is not in increasing timestamp order`);
    }
  });

  const durationMs = Math.max(0, Math.round((durationSeconds ?? 0) * 1000));
  return starts.map((cue, index) => ({
    ...cue,
    endMs:
      starts[index + 1]?.startMs ?? (durationMs > cue.startMs ? durationMs : cue.startMs + 5000)
  }));
}

export function validateCues(cues: ILyricCue[]): ILyricCue[] {
  if (!Array.isArray(cues) || cues.length === 0) throw new Error("Lyrics track has no cues");
  if (cues.length > 2000) throw new Error("Lyrics track exceeds 2000 cues");
  return cues.map((cue, index) => {
    const startMs = Number(cue.startMs);
    const endMs = Number(cue.endMs);
    const text = typeof cue.text === "string" ? cue.text.trim() : "";
    if (!Number.isFinite(startMs) || startMs < 0)
      throw new Error(`Cue ${index + 1} has invalid start`);
    if (!Number.isFinite(endMs) || endMs <= startMs) {
      throw new Error(`Cue ${index + 1} must end after it starts`);
    }
    if (!text) throw new Error(`Cue ${index + 1} has no text`);
    if (text.length > 4000) throw new Error(`Cue ${index + 1} exceeds 4000 characters`);
    if (index > 0 && startMs < Number(cues[index - 1].startMs)) {
      throw new Error(`Cue ${index + 1} starts before the previous cue`);
    }
    return { startMs, endMs, text };
  });
}

export function validateLyricsRows(rows: ILyricsRow[]): ILyricsRow[] {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("Lyrics have no rows");
  if (rows.length > 2000) throw new Error("Lyrics exceed 2000 rows");

  return rows.map((row, index) => {
    const startMs = Number(row.startMs);
    const endMs = Number(row.endMs);
    const ja = normalizedText(row.ja, index, "Japanese", true);
    if (!Number.isFinite(startMs) || startMs < 0) {
      throw new Error(`Row ${index + 1} has invalid start`);
    }
    if (!Number.isFinite(endMs) || endMs <= startMs) {
      throw new Error(`Row ${index + 1} must end after it starts`);
    }
    if (index > 0 && startMs < Number(rows[index - 1].startMs)) {
      throw new Error(`Row ${index + 1} starts before the previous row`);
    }

    return {
      startMs,
      endMs,
      ja,
      ...optionalText(row.romaji, index, "Romaji"),
      ...optionalText(row.en, index, "English"),
      ...optionalText(row.vi, index, "Vietnamese")
    };
  });
}

function normalizedText(
  value: unknown,
  index: number,
  label: string,
  required: boolean
): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (required && !text) throw new Error(`Row ${index + 1} has no ${label} text`);
  if (text.length > 4000) throw new Error(`Row ${index + 1} ${label} exceeds 4000 characters`);
  return text;
}

function optionalText(
  value: unknown,
  index: number,
  label: string
): Partial<Record<"romaji" | "en" | "vi", string>> {
  const text = normalizedText(value, index, label, false);
  if (!text) return {};
  const key = label === "Romaji" ? "romaji" : label === "English" ? "en" : "vi";
  return { [key]: text };
}
