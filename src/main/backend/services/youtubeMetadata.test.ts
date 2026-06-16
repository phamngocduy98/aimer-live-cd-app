import { afterEach, describe, expect, test, vi } from "vitest";

const execFileMock = vi.hoisted(() => vi.fn());

vi.mock("node:child_process", () => ({
  execFile: execFileMock
}));

const { fetchYoutubeMetadataPreview } = await import("./youtubeMetadata.js");

function mockYtDlp(payload: unknown): void {
  execFileMock.mockImplementation((...args) => {
    const callback = args.at(-1);
    if (typeof callback !== "function") throw new Error("Missing execFile callback");
    callback(null, JSON.stringify(payload), "");
  });
}

describe("YouTube metadata preview", () => {
  afterEach(() => {
    execFileMock.mockReset();
    vi.unstubAllGlobals();
  });

  test("normalizes yt-dlp metadata and imports native chapters", async () => {
    mockYtDlp({
      title: "Live Video",
      channel: "Aimer Official",
      webpage_url: "https://www.youtube.com/watch?v=abc",
      duration: 123.4,
      vcodec: "avc1.640028",
      acodec: "mp4a.40.2",
      asr: 44100,
      tbr: 256.5,
      ext: "mp4",
      chapters: [{ start_time: 0, title: "Intro" }],
      subtitles: {
        en: [{ ext: "vtt", url: "https://example.com/en.vtt", name: "English" }]
      },
      automatic_captions: {
        ja: [{ ext: "vtt", url: "https://example.com/ja.vtt", name: "Japanese" }]
      }
    });

    await expect(fetchYoutubeMetadataPreview("https://youtu.be/abc")).resolves.toMatchObject({
      title: "Live Video",
      artists: ["Aimer Official"],
      youtubeUrl: "https://www.youtube.com/watch?v=abc",
      duration: 123.4,
      videoCodecRaw: "avc1.640028",
      audioCodecRaw: "mp4a.40.2",
      audioSampleRate: 44100,
      bitrate: 256500,
      fileExtension: "mp4",
      chapters: [{ time: 0, title: "Intro", subTitle: "" }],
      subtitles: [
        {
          language: "en",
          name: "English",
          ext: "vtt",
          url: "https://example.com/en.vtt",
          automatic: false
        },
        {
          language: "ja",
          name: "Japanese",
          ext: "vtt",
          url: "https://example.com/ja.vtt",
          automatic: true
        }
      ]
    });
    expect(execFileMock).toHaveBeenCalledWith(
      "yt-dlp",
      ["--dump-single-json", "--skip-download", "--no-playlist", "https://youtu.be/abc"],
      expect.objectContaining({ windowsHide: true }),
      expect.any(Function)
    );
  });

  test("parses timestamp lines from the description when yt-dlp has no chapters", async () => {
    mockYtDlp({
      title: "Concert",
      uploader: "Concert Channel",
      original_url: "https://www.youtube.com/watch?v=def",
      duration: 240,
      description: "00:00 Opening\n01:15 - Main Song"
    });

    await expect(fetchYoutubeMetadataPreview("https://youtube.com/watch?v=def")).resolves.toEqual(
      expect.objectContaining({
        chapters: [
          { time: 0, title: "Opening", subTitle: "" },
          { time: 75, title: "Main Song", subTitle: "" }
        ]
      })
    );
  });

  test("returns fetched thumbnail bytes when they are a supported image", async () => {
    mockYtDlp({
      title: "With Cover",
      channel: "Cover Channel",
      webpage_url: "https://www.youtube.com/watch?v=cover",
      duration: 60,
      thumbnail: "https://i.ytimg.com/vi/cover/maxresdefault.jpg"
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(Uint8Array.from([0xff, 0xd8, 0xff]), {
          status: 200
        })
      )
    );

    await expect(fetchYoutubeMetadataPreview("https://youtube.com/watch?v=cover")).resolves.toEqual(
      expect.objectContaining({
        cover: { mimeType: "image/jpeg", base64: "/9j/" }
      })
    );
  });

  test("rejects non-YouTube URLs and missing executables clearly", async () => {
    await expect(fetchYoutubeMetadataPreview("https://example.com")).rejects.toThrow("YouTube URL");

    execFileMock.mockImplementation((...args) => {
      const callback = args.at(-1);
      if (typeof callback !== "function") throw new Error("Missing execFile callback");
      callback(Object.assign(new Error("missing"), { code: "ENOENT" }), "", "");
    });
    await expect(
      fetchYoutubeMetadataPreview("https://youtube.com/watch?v=missing")
    ).rejects.toThrow("yt-dlp was not found");
  });
});
