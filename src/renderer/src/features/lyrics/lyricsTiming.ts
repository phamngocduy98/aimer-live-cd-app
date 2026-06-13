import type { LyricCue } from "./types";

type TimedValue = { startMs: number; endMs: number };

export function findActiveCueIndex(cues: TimedValue[], positionMs: number): number {
  let low = 0;
  let high = cues.length - 1;
  let result = -1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (cues[middle].startMs <= positionMs) {
      result = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return result >= 0 && positionMs < cues[result].endMs ? result : -1;
}

export function findActiveCue(cues: LyricCue[], positionMs: number): LyricCue | undefined {
  const index = findActiveCueIndex(cues, positionMs);
  return index >= 0 ? cues[index] : undefined;
}
