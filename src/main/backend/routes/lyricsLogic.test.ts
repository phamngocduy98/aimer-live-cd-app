import { describe, expect, test } from "vitest";
import { parseLrc, parseSrt, validateCues, validateLyricsRows } from "./lyricsLogic.js";

describe("parseSrt", () => {
  test("parses BOM, CRLF, comma timestamps, and multiline cues", () => {
    expect(
      parseSrt(
        "\uFEFF1\r\n00:00:01,250 --> 00:00:03,500\r\nFirst line\r\nSecond line\r\n\r\n2\r\n00:00:04,000 --> 00:00:05,000\r\nNext"
      )
    ).toEqual([
      { startMs: 1250, endMs: 3500, text: "First line\nSecond line" },
      { startMs: 4000, endMs: 5000, text: "Next" }
    ]);
  });

  test("rejects malformed or unordered cues", () => {
    expect(() => parseSrt("1\nbad\nText")).toThrow("Invalid SRT timing");
    expect(() =>
      parseSrt(
        "1\n00:00:02,000 --> 00:00:03,000\nLater\n\n2\n00:00:01,000 --> 00:00:02,000\nEarlier"
      )
    ).toThrow("starts before");
  });
});

describe("parseLrc", () => {
  test("parses synchronized LRC and derives cue ends", () => {
    expect(parseLrc("[00:01.20]一行目\n[00:03.500]二行目", 6)).toEqual([
      { startMs: 1200, endMs: 3500, text: "一行目" },
      { startMs: 3500, endMs: 6000, text: "二行目" }
    ]);
  });

  test("rejects unsynchronized and non-monotonic content", () => {
    expect(() => parseLrc("plain lyrics")).toThrow("no synchronized");
    expect(() => parseLrc("[00:02.00]later\n[00:01.00]earlier")).toThrow("increasing");
  });
});

describe("validateCues", () => {
  test("normalizes valid preview cues and rejects invalid tracks", () => {
    expect(validateCues([{ startMs: 0, endMs: 1000, text: " line " }])).toEqual([
      { startMs: 0, endMs: 1000, text: "line" }
    ]);
    expect(() => validateCues([{ startMs: 10, endMs: 10, text: "bad" }])).toThrow("end after");
  });
});

describe("validateLyricsRows", () => {
  test("normalizes one synchronized multilingual row", () => {
    expect(
      validateLyricsRows([
        {
          startMs: 0,
          endMs: 1000,
          ja: " 日本語 ",
          romaji: " nihongo ",
          en: " Japanese ",
          vi: ""
        }
      ])
    ).toEqual([
      {
        startMs: 0,
        endMs: 1000,
        ja: "日本語",
        romaji: "nihongo",
        en: "Japanese"
      }
    ]);
  });

  test("requires ordered rows with Japanese text", () => {
    expect(() => validateLyricsRows([{ startMs: 0, endMs: 1000, ja: "" }])).toThrow(
      "no Japanese"
    );
    expect(() =>
      validateLyricsRows([
        { startMs: 1000, endMs: 2000, ja: "later" },
        { startMs: 500, endMs: 900, ja: "earlier" }
      ])
    ).toThrow("starts before");
  });
});
