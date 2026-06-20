import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Song, Video } from "@features/library/types";
import type { SessionState } from "../types";
import { guestSession } from "../types";

type SubscriptionPromptMedia = Song | Video;

interface AuthSliceState {
  session: SessionState;
  subscriptionPromptOpen: boolean;
  subscriptionPromptMedia: SubscriptionPromptMedia | null;
}

const authSlice = createSlice({
  name: "auth",
  initialState: {
    session: guestSession,
    subscriptionPromptOpen: false,
    subscriptionPromptMedia: null
  } as AuthSliceState,
  reducers: {
    setSession(state, action: PayloadAction<SessionState>) {
      state.session = action.payload;
    },
    showSubscriptionPrompt(state, action: PayloadAction<SubscriptionPromptMedia | undefined>) {
      state.subscriptionPromptOpen = true;
      state.subscriptionPromptMedia = action.payload ?? null;
    },
    hideSubscriptionPrompt(state) {
      state.subscriptionPromptOpen = false;
    },
    clearSubscriptionPromptMedia(state) {
      state.subscriptionPromptMedia = null;
    }
  }
});

export const {
  clearSubscriptionPromptMedia,
  hideSubscriptionPrompt,
  setSession,
  showSubscriptionPrompt
} = authSlice.actions;
export default authSlice.reducer;
