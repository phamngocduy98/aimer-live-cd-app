import { describe, expect, it } from "vitest";
import { parseChapterCsv, parseChapterTime } from "./adminFormatting";

describe("parseChapterTime", () => {
  it("parses seconds and clock timestamps", () => {
    expect(parseChapterTime("12.5")).toBe(12.5);
    expect(parseChapterTime("01:02:03")).toBe(3723);
  });

  it("returns zero for empty or invalid values", () => {
    expect(parseChapterTime("")).toBe(0);
    expect(parseChapterTime("not-a-time")).toBe(0);
  });
});

describe("parseChapterCsv", () => {
  it("parses chapter rows and ignores blank lines", () => {
    expect(parseChapterCsv("00:10,Intro,Opening\n\n75,Verse")).toEqual([
      { time: 10, title: "Intro", subTitle: "Opening" },
      { time: 75, title: "Verse", subTitle: "" }
    ]);
  });
});
