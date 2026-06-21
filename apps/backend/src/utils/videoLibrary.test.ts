import { describe, expect, it } from "vitest";
import {
  inheritVideoAlbumMetadata,
  normalizeVideoChapters,
  syncDefaultVideoChapterTitle
} from "./videoLibrary.js";

describe("video library rules", () => {
  it("creates a title-matched default chapter for an empty list", () => {
    expect(normalizeVideoChapters("Concert", [])).toEqual([
      { time: 0, title: "Concert", subTitle: "" }
    ]);
  });

  it("preserves authored chapters", () => {
    const chapters = [{ time: 12, title: "Song", subTitle: "Artist" }];
    expect(normalizeVideoChapters("Concert", chapters)).toEqual(chapters);
  });

  it("fills missing chapter subtitles with an empty string", () => {
    expect(
      normalizeVideoChapters("Concert", [{ time: 12, title: "Song" } as any])
    ).toEqual([{ time: 12, title: "Song", subTitle: "" }]);
  });

  it("renames only the generated default chapter when the video title changes", () => {
    expect(
      syncDefaultVideoChapterTitle("Old", "New", [{ time: 0, title: "Old", subTitle: "" }])
    ).toEqual([{ time: 0, title: "New", subTitle: "" }]);
    expect(
      syncDefaultVideoChapterTitle("Old", "New", [{ time: 0, title: "Custom", subTitle: "" }])
    ).toEqual([{ time: 0, title: "Custom", subTitle: "" }]);
  });

  it("inherits only missing video release metadata from an album", () => {
    const albumCover = Buffer.from("album");
    const videoCover = Buffer.from("video");
    expect(
      inheritVideoAlbumMetadata(
        { cover: videoCover, year: 2026, genre: ["Live"] },
        { cover: albumCover, year: 2020, genre: ["Rock"] }
      )
    ).toEqual({ cover: videoCover, year: 2026, genre: ["Live"] });
    expect(
      inheritVideoAlbumMetadata({}, { cover: albumCover, year: 2020, genre: ["Rock"] })
    ).toEqual({ cover: albumCover, year: 2020, genre: ["Rock"] });
    expect(inheritVideoAlbumMetadata({ genre: [] }, { genre: ["Rock"] })).toEqual({
      genre: ["Rock"]
    });
  });
});
