import { describe, expect, it } from "vitest";
import { findMatchingVideoChapters } from "./searchLogic.js";

describe("search chapter matching", () => {
  const video = {
    title: "Concert Film",
    chapters: [
      { time: 0, title: "Intro", subTitle: "Opening" },
      { time: 60, title: "Main Song", subTitle: "Chorus section" }
    ]
  };

  it("matches chapter titles", () => {
    expect(findMatchingVideoChapters([video], /intro/i)).toEqual([
      { video, chapterIndex: 0, chapter: video.chapters[0] }
    ]);
  });

  it("matches chapter subtitles", () => {
    expect(findMatchingVideoChapters([video], /chorus/i)).toEqual([
      { video, chapterIndex: 1, chapter: video.chapters[1] }
    ]);
  });

  it("returns no chapter matches when no chapter text matches", () => {
    expect(findMatchingVideoChapters([video], /missing/i)).toEqual([]);
  });

  it("limits flattened chapter matches", () => {
    const matches = findMatchingVideoChapters([video], /o/i, 1);

    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({ video, chapterIndex: 0, chapter: video.chapters[0] });
  });
});
