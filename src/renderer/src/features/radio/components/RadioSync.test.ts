import { describe, expect, it } from "vitest";
import type { Song } from "@features/library";
import type { CurrentRadioItem, RadioState } from "../types";
import { radioPlaybackSyncKey } from "./RadioSync";

const song = (id: string): Song => ({
  _id: id,
  trackNo: 1,
  title: id,
  artist: ["Artist"],
  size: 1,
  duration: 120,
  format: "mp3",
  lossless: false,
  bitrate: 320,
  fileExtension: "mp3",
  bitdepth: "16",
  sampleRate: 44100
});

const current = (overrides: Partial<CurrentRadioItem> = {}): CurrentRadioItem => ({
  slotId: "slot-live",
  mediaType: "audio",
  media: song("hosted-audio"),
  source: "queue",
  startedAt: "2026-06-21T00:00:00.000Z",
  duration: 120,
  position: 12,
  streamUrl: "/radio/stream/slot-live",
  ...overrides
});

const state = (overrides: Partial<RadioState> = {}): RadioState => ({
  serverTime: "2026-06-21T00:00:12.000Z",
  current: current(),
  history: [],
  listenerCount: 1,
  stationStatus: { paused: false },
  ...overrides
});

describe("radioPlaybackSyncKey", () => {
  it("ignores clock and listener updates for the same hosted radio source", () => {
    const first = radioPlaybackSyncKey(current({ position: 12 }), state({ listenerCount: 1 }));
    const second = radioPlaybackSyncKey(
      current({ position: 32 }),
      state({ listenerCount: 4, serverTime: "2026-06-21T00:00:32.000Z" })
    );

    expect(second).toBe(first);
  });

  it("changes when the radio stream source changes", () => {
    const first = radioPlaybackSyncKey(current(), state());
    const second = radioPlaybackSyncKey(
      current({
        slotId: "slot-next",
        media: song("next-hosted-audio"),
        startedAt: "2026-06-21T00:02:00.000Z",
        streamUrl: "/radio/stream/slot-next"
      }),
      state()
    );

    expect(second).not.toBe(first);
  });
});
