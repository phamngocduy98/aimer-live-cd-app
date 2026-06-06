import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PlayerGuiSlice {
  playingQueue: boolean;
  mobilePlayer: boolean;
}

const playerGuiSlice = createSlice({
  name: "playerGui",
  initialState: {
    playingQueue: false,
    mobilePlayer: false
  } as PlayerGuiSlice,
  reducers: {
    showView(state, payload: PayloadAction<keyof PlayerGuiSlice>) {
      state[payload.payload] = true;
    },
    hideView(state, payload: PayloadAction<keyof PlayerGuiSlice>) {
      state[payload.payload] = false;
    },
    toggleView(state, payload: PayloadAction<keyof PlayerGuiSlice>) {
      state[payload.payload] = !state[payload.payload];
    }
  }
});

export const { hideView, showView, toggleView } = playerGuiSlice.actions;

export default playerGuiSlice.reducer;
