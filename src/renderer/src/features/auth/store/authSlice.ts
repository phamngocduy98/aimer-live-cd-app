import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SessionState } from "../types";
import { guestSession } from "../types";

interface AuthSliceState {
  session: SessionState;
  subscriptionPromptOpen: boolean;
}

const authSlice = createSlice({
  name: "auth",
  initialState: {
    session: guestSession,
    subscriptionPromptOpen: false
  } as AuthSliceState,
  reducers: {
    setSession(state, action: PayloadAction<SessionState>) {
      state.session = action.payload;
    },
    showSubscriptionPrompt(state) {
      state.subscriptionPromptOpen = true;
    },
    hideSubscriptionPrompt(state) {
      state.subscriptionPromptOpen = false;
    }
  }
});

export const { hideSubscriptionPrompt, setSession, showSubscriptionPrompt } = authSlice.actions;
export default authSlice.reducer;
