import { configureStore } from "@reduxjs/toolkit"
import authReducer from "@features/auth/store/authSlice"
import playerGuiReducer from "@features/player/store/playerGuiSlice"
import playerReducer from "@features/player/store/playerSlice"
import playerVideoControlReducer from "@features/player/store/playerVideoControl"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    playerGui: playerGuiReducer,
    player: playerReducer,
    playerVideoControl: playerVideoControlReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
