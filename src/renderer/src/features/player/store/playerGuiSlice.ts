import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { LyricPairId } from "@features/lyrics/types";

interface PlayerGuiSlice {
  playingQueue: boolean;
  mobilePlayer: boolean;
  lyrics: boolean;
  lyricPair: LyricPairId;
}

type PlayerView = "playingQueue" | "mobilePlayer" | "lyrics";

const playerGuiSlice = createSlice({
  name: "playerGui",
  initialState: {
    playingQueue: false,
    mobilePlayer: false,
    lyrics: false,
    lyricPair: "ja-romaji"
  } as PlayerGuiSlice,
  reducers: {
    showView(state, payload: PayloadAction<PlayerView>) {
      state[payload.payload] = true;
    },
    hideView(state, payload: PayloadAction<PlayerView>) {
      state[payload.payload] = false;
    },
    toggleView(state, payload: PayloadAction<PlayerView>) {
      state[payload.payload] = !state[payload.payload];
    },
    setLyricPair(state, payload: PayloadAction<LyricPairId>) {
      state.lyricPair = payload.payload;
    }
  }
});

export const { hideView, showView, toggleView, setLyricPair } = playerGuiSlice.actions;

export default playerGuiSlice.reducer;
