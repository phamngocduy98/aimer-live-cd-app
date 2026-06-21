import { describe, expect, it } from "vitest";
import { mergeRadioStateUpdate } from "./useRadio";
import type { Song } from "@features/library";
import type { RadioState, RadioUpcomingItem } from "../types";

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

const state = (upcoming?: RadioUpcomingItem[]): RadioState => ({
  serverTime: "2026-06-21T00:00:00.000Z",
  current: null,
  history: [],
  listenerCount: 0,
  stationStatus: { paused: false },
  upcoming
});

describe("mergeRadioStateUpdate", () => {
  it("preserves viewer-scoped upcoming rows when an SSE update omits upcoming", () => {
    const requested = [
      {
        queueItemId: "queue-1",
        mediaType: "audio",
        media: song("song-1"),
        requestedAt: "2026-06-21T00:00:00.000Z",
        position: 2
      }
    ] satisfies RadioUpcomingItem[];

    const merged = mergeRadioStateUpdate(state(requested), {
      ...state(),
      listenerCount: 4
    });

    expect(merged.listenerCount).toBe(4);
    expect(merged.upcoming).toBe(requested);
  });

  it("uses an explicit upcoming value from the incoming state", () => {
    const current = state([
      {
        queueItemId: "queue-1",
        mediaType: "audio",
        media: song("song-1"),
        requestedAt: "2026-06-21T00:00:00.000Z",
        position: 1
      }
    ]);

    expect(mergeRadioStateUpdate(current, state([])).upcoming).toEqual([]);
  });
});
