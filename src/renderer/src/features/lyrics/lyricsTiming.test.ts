import { describe, expect, test } from "vitest";
import { findActiveCue, findActiveCueIndex } from "./lyricsTiming";

const cues = [
  { startMs: 1000, endMs: 2000, text: "one" },
  { startMs: 2500, endMs: 4000, text: "two" }
];

describe("lyrics timing", () => {
  test("uses inclusive starts and exclusive ends", () => {
    expect(findActiveCueIndex(cues, 999)).toBe(-1);
    expect(findActiveCueIndex(cues, 1000)).toBe(0);
    expect(findActiveCueIndex(cues, 2000)).toBe(-1);
    expect(findActiveCue(cues, 3000)?.text).toBe("two");
  });

  test("finds a unified lyric row by its shared timing", () => {
    const rows = [{ startMs: 0, endMs: 1000, ja: "日本語", romaji: "nihongo" }];
    expect(findActiveCueIndex(rows, 500)).toBe(0);
  });
});
