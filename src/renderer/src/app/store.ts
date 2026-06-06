import { configureStore } from "@reduxjs/toolkit"
import playerGuiReducer from "../store/player/playerGuiSlice"
import playerReducer from "../store/player/playerSlice"
import playerVideoControlReducer from "../store/player/playerVideoControl"

export const store = configureStore({
  reducer: {
    playerGui: playerGuiReducer,
    player: playerReducer,
    playerVideoControl: playerVideoControlReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
