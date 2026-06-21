import { describe, expect, it } from "vitest";
import reducer, {
  deleteTrack,
  nextTrack,
  playContext,
  playRadio,
  prevTrack,
  setPlaybackAccess,
  setRadioListening
} from "./playerSlice";
import type { Song, Video } from "@features/library/types";
import { mediaSourcePath } from "../types";

const song = (id: string): Song => ({
  _id: id,
  trackNo: 1,
  title: id,
  artist: ["Artist"],
  size: 1,
  duration: 100,
  format: "mp3",
  lossless: false,
  bitrate: 320,
  fileExtension: "mp3",
  bitdepth: "16",
  sampleRate: 44100
});

const video = (id: string): Video => ({
  _id: id,
  title: id,
  artist: ["Artist"],
  size: 1,
  duration: 120,
  videoWidth: 1920,
  videoHeight: 1080,
  videoCodecRaw: "h264",
  audioLossless: false,
  audioSampleRate: 44100,
  audioBitsPerSample: 16,
  audioCodecRaw: "aac",
  fileExtension: "mp4",
  format: "mp4",
  bitrate: 1000,
  chapters: []
});

describe("player queue", () => {
  const source = { type: "playlist" as const, id: "p1", label: "Mix", route: "/playlist/p1" };
  const paidState = () => reducer(undefined, setPlaybackAccess({ canAccessPaidMedia: true }));

  it("builds a mixed queue with unique occurrence identity and context", () => {
    const state = reducer(
      paidState(),
      playContext({
        items: [song("same"), video("video"), song("same")],
        playFrom: source,
        sourceItemKeys: ["one", "two", "three"],
        startIndex: 1
      })
    );

    expect(state.playingTrack?.type).toBe("video");
    expect(state.currentEntry?.sourceItemKey).toBe("two");
    expect(state.history[0].sourceItemKey).toBe("one");
    expect(state.queue[0].sourceItemKey).toBe("three");
    expect(
      new Set([state.history[0], state.currentEntry, state.queue[0]].map((e) => e?.queueEntryId))
        .size
    ).toBe(3);
  });

  it("moves through mixed entries and removes a single occurrence", () => {
    let state = reducer(
      paidState(),
      playContext({ items: [song("same"), video("video"), song("same")], playFrom: source })
    );
    const lastId = state.queue[1].queueEntryId;
    state = reducer(state, deleteTrack({ queueEntryId: lastId }));
    expect(state.queue).toHaveLength(1);
    state = reducer(state, nextTrack());
    expect(state.playingTrack?.type).toBe("video");
    state = reducer(state, prevTrack());
    expect(state.playingTrack?._id).toBe("same");
  });

  it("uses the video stream endpoint when a local video has no type discriminator", () => {
    const localVideo = video("local-video");
    delete localVideo.type;

    expect(mediaSourcePath(localVideo)).toBe("/stream/video/local-video");
  });

  it("uses the YouTube URL without routing through the local stream API", () => {
    const youtubeVideo = { ...video("youtube-video"), youtubeUrl: "https://youtu.be/example" };

    expect(mediaSourcePath(youtubeVideo)).toBe("https://youtu.be/example");
  });

  it("filters restricted media from a guest queue", () => {
    const youtubeVideo = { ...video("youtube-video"), youtubeUrl: "https://youtu.be/example" };
    const state = reducer(
      undefined,
      playContext({ items: [song("song"), video("local-video"), youtubeVideo], playFrom: source })
    );

    expect(state.playingTrack?._id).toBe("youtube-video");
    expect(state.queue).toHaveLength(0);
  });

  it("enters radio mode with current and history but no upcoming queue", () => {
    const state = reducer(
      paidState(),
      playRadio({
        media: song("live"),
        mediaType: "audio",
        slotId: "slot-live",
        startedAt: "2026-06-21T00:00:00.000Z",
        serverTime: "2026-06-21T00:00:12.000Z",
        position: 12,
        duration: 100,
        streamUrl: "/radio/stream/slot-live",
        history: [
          {
            slotId: "slot-prev",
            mediaType: "video",
            media: video("previous"),
            startedAt: "2026-06-20T23:58:00.000Z",
            duration: 120
          }
        ]
      })
    );

    expect(state.radio.enabled).toBe(true);
    expect(state.currentEntry?.playFrom.type).toBe("radio");
    expect(state.currentEntry?.sourceUrl).toBe("/radio/stream/slot-live");
    expect(state.history).toHaveLength(1);
    expect(state.queue).toHaveLength(0);
  });

  it("prevents manual next and previous changes while listening to radio", () => {
    let state = reducer(
      paidState(),
      playRadio({
        media: song("live"),
        mediaType: "audio",
        slotId: "slot-live",
        startedAt: "2026-06-21T00:00:00.000Z",
        serverTime: "2026-06-21T00:00:12.000Z",
        position: 12,
        duration: 100,
        streamUrl: "/radio/stream/slot-live",
        history: [
          {
            slotId: "slot-prev",
            mediaType: "audio",
            media: song("previous"),
            startedAt: "2026-06-20T23:58:00.000Z",
            duration: 100
          }
        ]
      })
    );

    state = reducer(state, prevTrack());
    expect(state.playingTrack?._id).toBe("live");

    state = reducer(state, nextTrack({ isUser: true }));
    expect(state.playingTrack?._id).toBe("live");

    state = reducer(state, setRadioListening(false));
    expect(state.radio.listening).toBe(false);
  });

  it("keeps local listening state when the station is globally paused", () => {
    const state = reducer(
      paidState(),
      playRadio({
        media: song("paused-live"),
        mediaType: "audio",
        slotId: "slot-paused",
        startedAt: "2026-06-21T00:00:00.000Z",
        serverTime: "2026-06-21T00:00:12.000Z",
        position: 12,
        duration: 100,
        streamUrl: "/radio/stream/slot-paused",
        paused: true
      })
    );

    expect(state.radio.enabled).toBe(true);
    expect(state.radio.listening).toBe(true);
    expect(state.radio.paused).toBe(true);
    expect(state.currentEntry?.sourceUrl).toBe("/radio/stream/slot-paused");
  });
});
