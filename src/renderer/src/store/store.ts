import { configureStore } from "@reduxjs/toolkit";
import playerGuiReducer from "./player/playerGuiSlice";
import playerReducer from "./player/playerSlice";
import playerVideoControlReducer from "./player/playerVideoControl";

export const store = configureStore({
  reducer: {
    playerGui: playerGuiReducer,
    player: playerReducer,
    playerVideoControl: playerVideoControlReducer
  }
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
