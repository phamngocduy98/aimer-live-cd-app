import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PlayerVideoControlSlice {
  videoUrl: string | null;
  videoPlaying: boolean;
  videoLoop: boolean;
  videoVolume: number; // 0-1
  videoMuted: boolean;

  videoIsReady: boolean;
  videoIsLoading: boolean;
  videoError: string | null;

  videoPosition: number;
  videoSeekPosition: number | null;
}

const playerVideoControlSlice = createSlice({
  name: "playerVideoControl",
  initialState: {
    videoUrl: null,
    videoPlaying: false,
    videoLoop: false,
    videoVolume: 1,
    videoMuted: false,
    videoIsReady: false,
    videoIsLoading: true,
    videoError: null,
    videoPosition: 0,
    videoSeekPosition: null
  } as PlayerVideoControlSlice,
  reducers: {
    loadVideo(state, payload: PayloadAction<{ url: string }>) {
      state.videoUrl = payload.payload.url;
      state.videoPlaying = true;
      state.videoIsReady = false;
      state.videoIsLoading = false;
      state.videoPosition = 0;
      state.videoSeekPosition = null;
      state.videoLoop = false;
    },
    togglePlayPauseVideo(state) {
      state.videoPlaying = !state.videoPlaying;
    },
    stopVideo(state) {
      state.videoPlaying = false;
    },
    loopVideo(state, payload: PayloadAction<{ loopOnOff: boolean }>) {
      state.videoLoop = payload.payload.loopOnOff;
    },
    videoSetVolume(state, payload: PayloadAction<number>) {
      state.videoVolume = payload.payload;
    },
    videoOnReady(state) {
      state.videoIsReady = true;
    },
    videoOnError(state, payload: PayloadAction<{ error: string }>) {
      state.videoError = payload.payload.error;
    },
    videoOnBuffer(state) {
      state.videoIsLoading = true;
    },
    videoOnBufferEnd(state) {
      state.videoIsLoading = false;
    },
    videoOnProgress(state, payload: PayloadAction<{ position: number }>) {
      state.videoPosition = payload.payload.position;
    },
    videoOnSeek(state, payload: PayloadAction<{ position: number | null }>) {
      state.videoSeekPosition = payload.payload.position;
    }
  }
});

export const {
  loadVideo,
  togglePlayPauseVideo,
  loopVideo,
  stopVideo,
  videoOnError,
  videoOnReady,
  videoOnBuffer,
  videoOnBufferEnd,
  videoOnProgress,
  videoOnSeek,
  videoSetVolume
} = playerVideoControlSlice.actions;

export default playerVideoControlSlice.reducer;
