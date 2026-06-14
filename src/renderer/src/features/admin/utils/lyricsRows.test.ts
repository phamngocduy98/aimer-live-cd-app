import { describe, expect, it } from "vitest";
import { cloneRows, cuesFromRows, rowsFromCues } from "./lyricsRows";

describe("lyrics row conversion", () => {
  it("combines Japanese and Romaji cues by index", () => {
    expect(
      rowsFromCues(
        [{ startMs: 0, endMs: 1000, text: "日本語" }],
        [{ startMs: 0, endMs: 1000, text: "nihongo" }]
      )
    ).toEqual([{ startMs: 0, endMs: 1000, ja: "日本語", romaji: "nihongo" }]);
  });

  it("converts rows back to Japanese cues", () => {
    expect(cuesFromRows([{ startMs: 10, endMs: 20, ja: "歌詞", en: "lyrics" }])).toEqual([
      { startMs: 10, endMs: 20, text: "歌詞" }
    ]);
  });

  it("clones rows without retaining object references", () => {
    const rows = [{ startMs: 0, endMs: 1, ja: "a" }];
    const cloned = cloneRows(rows);
    expect(cloned).toEqual(rows);
    expect(cloned[0]).not.toBe(rows[0]);
  });
});
