import { describe, expect, it } from "vitest";
import { resolveVideoSize } from "./videoAspect";

describe("resolveVideoSize", () => {
  it("uses the native dimensions measured for the current source", () => {
    expect(
      resolveVideoSize(
        "video-b:/api/stream/video/b",
        {
          sourceKey: "video-b:/api/stream/video/b",
          width: 1080,
          height: 1920
        },
        1920,
        1080
      )
    ).toEqual({ width: 1080, height: 1920 });
  });

  it("ignores dimensions measured for the previous source", () => {
    expect(
      resolveVideoSize(
        "video-b:/api/stream/video/b",
        {
          sourceKey: "video-a:/api/stream/video/a",
          width: 1920,
          height: 1080
        },
        1080,
        1920
      )
    ).toEqual({ width: 1080, height: 1920 });
  });
});
