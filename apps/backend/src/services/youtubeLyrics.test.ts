import { afterEach, describe, expect, test, vi } from "vitest";
import { Types } from "mongoose";
import { Lyrics } from "../models/Lyrics.js";
import { importYoutubeSubtitleLyrics, parseWebVtt } from "./youtubeLyrics.js";

vi.mock("../models/Lyrics.js", async () => {
  const actual = await vi.importActual<typeof import("../models/Lyrics.js")>("../models/Lyrics.js");
  return {
    ...actual,
    Lyrics: {
      findOneAndUpdate: vi.fn()
    }
  };
});

const vtt = (text: string): string => `WEBVTT

00:00:00.000 --> 00:00:02.000
${text}

00:00:02.000 --> 00:00:04.000
${text} 2
`;

describe("YouTube subtitle lyrics import", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(Lyrics.findOneAndUpdate).mockReset();
    delete process.env.E2E_TEST_MODE;
  });

  test("parses WebVTT cues", () => {
    expect(parseWebVtt(vtt("歌詞"))).toEqual([
      { startMs: 0, endMs: 2000, text: "歌詞" },
      { startMs: 2000, endMs: 4000, text: "歌詞 2" }
    ]);
  });

  test("saves Japanese, Romaji, English, and Vietnamese rows from captions", async () => {
    process.env.E2E_TEST_MODE = "true";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const body = url.includes("/en/")
          ? vtt("English")
          : url.includes("/vi/")
            ? vtt("Tiếng Việt")
            : vtt("日本語");
        return new Response(body, { status: 200 });
      })
    );

    const mediaId = new Types.ObjectId();
    const rows = await importYoutubeSubtitleLyrics(mediaId, [
      { language: "ja", ext: "vtt", url: "https://subs.test/ja/track.vtt" },
      { language: "en", ext: "vtt", url: "https://subs.test/en/track.vtt" },
      { language: "vi", ext: "vtt", url: "https://subs.test/vi/track.vtt" }
    ]);

    expect(rows?.[0]).toEqual({
      startMs: 0,
      endMs: 2000,
      ja: "日本語",
      romaji: "romaji preview 1",
      en: "English",
      vi: "Tiếng Việt"
    });
    expect(Lyrics.findOneAndUpdate).toHaveBeenCalledWith(
      { mediaType: "video", mediaId },
      expect.objectContaining({
        $set: expect.objectContaining({
          provenance: expect.objectContaining({
            ja: expect.objectContaining({ source: "youtube" }),
            romaji: expect.objectContaining({ source: "kuroshiro" }),
            en: expect.objectContaining({ source: "youtube" }),
            vi: expect.objectContaining({ source: "youtube" })
          })
        })
      }),
      expect.objectContaining({ upsert: true })
    );
  });

  test("skips lyrics import when Japanese captions are missing", async () => {
    await expect(
      importYoutubeSubtitleLyrics(new Types.ObjectId(), [
        { language: "en", ext: "vtt", url: "https://subs.test/en/track.vtt" }
      ])
    ).resolves.toBeNull();
    expect(Lyrics.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
