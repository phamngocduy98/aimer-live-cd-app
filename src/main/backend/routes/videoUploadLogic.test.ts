import { describe, expect, it } from "vitest";
import { parseYoutubeVideoMetadata, validateImageUpload } from "./videoUploadLogic.js";

describe("YouTube video upload metadata", () => {
  it("parses album-like release metadata and supplies a default chapter", () => {
    expect(
      parseYoutubeVideoMetadata(
        JSON.stringify({
          title: "Concert",
          artists: ["Artist", "Artist"],
          year: 2026,
          genres: ["Live"],
          youtubeUrl: "https://youtube.com/watch?v=1",
          duration: 120
        })
      )
    ).toEqual({
      title: "Concert",
      artist: ["Artist"],
      year: 2026,
      genre: ["Live"],
      youtubeUrl: "https://youtube.com/watch?v=1",
      duration: 120,
      chapters: [{ time: 0, title: "Concert", subTitle: "" }]
    });
  });

  it("rejects invalid metadata and non-image covers", () => {
    expect(() => parseYoutubeVideoMetadata("{}")).toThrow("title is required");
    expect(() =>
      validateImageUpload({ mimetype: "text/plain" } as Express.Multer.File)
    ).toThrow("cover must be an image");
  });
});
