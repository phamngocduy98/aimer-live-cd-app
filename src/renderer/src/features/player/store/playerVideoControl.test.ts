import { describe, expect, it } from "vitest";
import reducer, { loadVideo, videoOnError, videoOnReady, videoOnSeek } from "./playerVideoControl";

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

  it("starts a fresh load when switching video sources", () => {
    let state = reducer(undefined, loadVideo({ url: "/hosted-video", mediaId: "video-one" }));
    state = reducer(state, videoOnReady());
    state = reducer(state, videoOnError({ error: "hosted stream ended" }));

    state = reducer(state, loadVideo({ url: "https://youtu.be/example", mediaId: "video-two" }));

    expect(state.videoUrl).toBe("https://youtu.be/example");
    expect(state.videoLoadedMediaId).toBe("video-two");
    expect(state.videoIsReady).toBe(false);
    expect(state.videoIsLoading).toBe(true);
    expect(state.videoError).toBeNull();
    expect(state.videoPosition).toBe(0);
  });
});
