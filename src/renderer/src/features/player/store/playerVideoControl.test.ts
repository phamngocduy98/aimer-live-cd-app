import { describe, expect, it } from "vitest";
import reducer, { loadVideo, videoOnReady, videoOnSeek } from "./playerVideoControl";

describe("player video control", () => {
  it("preserves a pending seek for the video being loaded", () => {
    let state = reducer(undefined, videoOnSeek({ position: 42, mediaId: "video-two" }));
    state = reducer(state, loadVideo({ url: "/video-two", mediaId: "video-two" }));
    state = reducer(state, videoOnReady());

    expect(state.videoSeekPosition).toBe(42);
    expect(state.videoSeekMediaId).toBe("video-two");
    expect(state.videoIsReady).toBe(true);
  });

  it("drops a seek that belongs to a different video", () => {
    let state = reducer(undefined, videoOnSeek({ position: 42, mediaId: "video-one" }));
    state = reducer(state, loadVideo({ url: "/video-two", mediaId: "video-two" }));

    expect(state.videoSeekPosition).toBeNull();
    expect(state.videoSeekMediaId).toBeNull();
  });
});
