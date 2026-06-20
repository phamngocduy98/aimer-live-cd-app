import { describe, expect, test } from "vitest";
import reducer, {
  clearSubscriptionPromptMedia,
  hideSubscriptionPrompt,
  showSubscriptionPrompt
} from "./authSlice";
import { guestSession } from "../types";
import type { Song } from "@features/library/types";

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

describe("auth slice", () => {
  test("keeps subscription prompt media until the dialog exit animation finishes", () => {
    const opened = reducer(undefined, showSubscriptionPrompt(song));

    expect(opened.subscriptionPromptOpen).toBe(true);
    expect(opened.subscriptionPromptMedia).toEqual(song);

    const closed = reducer(opened, hideSubscriptionPrompt());

    expect(closed.subscriptionPromptOpen).toBe(false);
    expect(closed.subscriptionPromptMedia).toEqual(song);

    const exited = reducer(closed, clearSubscriptionPromptMedia());

    expect(exited.subscriptionPromptOpen).toBe(false);
    expect(exited.subscriptionPromptMedia).toBeNull();
    expect(exited.session).toEqual(guestSession);
  });
});
