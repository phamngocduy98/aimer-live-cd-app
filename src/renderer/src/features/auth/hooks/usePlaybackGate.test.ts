import { describe, expect, test } from "vitest";
import {
  filterPlayableMedia,
  isFreePlayableMedia,
  preparePlaybackGatePayload
} from "./usePlaybackGate";
import type { Song, Video } from "@features/library/types";

const song: Song = {
  _id: "song",
  trackNo: 1,
  title: "Song",
  artist: ["Artist"],
  size: 1,
  duration: 1,
  format: "mp3",
  lossless: false,
  bitrate: 1,
  fileExtension: "mp3",
  bitdepth: "16",
  sampleRate: 44100
};

const localVideo: Video = {
  _id: "local-video",
  title: "Local",
  artist: ["Artist"],
  size: 1,
  duration: 1,
  videoWidth: 1920,
  videoHeight: 1080,
  videoCodecRaw: "h264",
  audioLossless: false,
  audioSampleRate: 44100,
  audioBitsPerSample: 16,
  audioCodecRaw: "aac",
  fileExtension: "mp4",
  format: "mp4",
  bitrate: 1,
  chapters: []
};

const youtubeVideo: Video = {
  ...localVideo,
  _id: "youtube-video",
  youtubeUrl: "https://youtu.be/example"
};

describe("playback gate", () => {
  test("allows only YouTube videos for free users", () => {
    expect(isFreePlayableMedia(youtubeVideo)).toBe(true);
    expect(isFreePlayableMedia(localVideo)).toBe(false);
    expect(isFreePlayableMedia(song)).toBe(false);
    expect(filterPlayableMedia([song, localVideo, youtubeVideo], false)).toEqual([youtubeVideo]);
  });

  test("allows every media item for paid access", () => {
    expect(filterPlayableMedia([song, localVideo, youtubeVideo], true)).toEqual([
      song,
      localVideo,
      youtubeVideo
    ]);
  });

  test("does not prompt when a free user explicitly starts a YouTube video from a mixed list", () => {
    const result = preparePlaybackGatePayload(
      {
        items: [song, youtubeVideo, localVideo],
        playFrom: { type: "videos", label: "Videos", route: "/videos" },
        startIndex: 1,
        sourceItemKeys: ["song-key", "youtube-key", "local-key"]
      },
      false
    );

    expect(result.showPrompt).toBe(false);
    expect(result.payload?.items).toEqual([youtubeVideo]);
    expect(result.payload?.startIndex).toBe(0);
    expect(result.payload?.sourceItemKeys).toEqual(["youtube-key"]);
  });

  test("prompts without starting playback when a free user explicitly starts paid media", () => {
    const result = preparePlaybackGatePayload(
      {
        items: [song, youtubeVideo],
        playFrom: { type: "songs", label: "Songs", route: "/songs" },
        startIndex: 0
      },
      false
    );

    expect(result.showPrompt).toBe(true);
    expect(result.payload).toBeUndefined();
  });

  test("prompts and plays the free subset for free-user bulk playback", () => {
    const result = preparePlaybackGatePayload(
      {
        items: [song, youtubeVideo, localVideo],
        playFrom: { type: "videos", label: "Videos", route: "/videos" }
      },
      false
    );

    expect(result.showPrompt).toBe(true);
    expect(result.payload?.items).toEqual([youtubeVideo]);
    expect(result.payload?.startIndex).toBe(0);
  });
});
