import { describe, expect, it } from "vitest";
import { findDuplicatePlaylistItems } from "./playlistLogic.js";

describe("mixed playlist duplicate policy", () => {
  it("uses media type and id as identity", () => {
    expect(
      findDuplicatePlaylistItems(
        [{ mediaType: "audio", mediaId: "same" }],
        [
          { mediaType: "video", mediaId: "same" },
          { mediaType: "audio", mediaId: "same" }
        ]
      )
    ).toEqual(["audio:same"]);
  });

  it("detects repeated occurrences inside one request", () => {
    expect(
      findDuplicatePlaylistItems(
        [],
        [
          { mediaType: "video", mediaId: "v1" },
          { mediaType: "video", mediaId: "v1" }
        ]
      )
    ).toEqual(["video:v1"]);
  });
});
