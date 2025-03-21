import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Song } from "../../core/Song";
import { shuffleArray } from "../../utils/shuffleArray";
import { isVideo, IVideoChapter, Video } from "../../core/Video";

type MSong = Song | Video;

interface PlayerSlice {
  playingTrack: MSong | null;
  queue: MSong[];
  originQueue: MSong[];
  history: MSong[];
  repeat: number; // 0, 1, 2
  chapters: IVideoChapter[];
  currentChapterIdx: number | null;
  currentChapterDuration: number;
}

const playerSlice = createSlice({
  name: "player",
  initialState: {
    playingTrack: null,
    queue: [],
    originQueue: [],
    history: [],
    repeat: 0,
    chapters: [],
    currentChapterIdx: null,
    currentChapterDuration: 0
  } satisfies PlayerSlice as PlayerSlice,
  reducers: {
    reset(
      state,
      payload: PayloadAction<{
        history?: MSong[];
        songs: MSong[];
        shuffle?: boolean;
        type: "audio" | "video";
      }>
    ) {
      payload.payload.history = payload.payload.history?.map((h) => ({
        ...h,
        type: payload.payload.type
      }));
      payload.payload.songs = payload.payload.songs.map((h) => ({
        ...h,
        type: payload.payload.type
      }));

      console.log("reset", payload);
      const songs = payload.payload.shuffle
        ? shuffleArray(payload.payload.songs)
        : payload.payload.songs;

      state.playingTrack = songs[0];
      state.chapters = isVideo(state.playingTrack) ? (state.playingTrack.chapters ?? []) : [];

      state.queue = songs.slice(1);
      if (payload.payload.shuffle) state.originQueue = payload.payload.songs;
      else state.originQueue = [];
      state.history = payload.payload.history ?? [];
    },
    toggleShuffleQueue(state) {
      if (state.originQueue.length === 0) {
        console.log("shuffle ON");
        state.originQueue = state.queue;
        state.queue = shuffleArray(state.queue);
      } else {
        console.log("shuffle OFF");
        state.queue = state.originQueue.filter((s) => state.queue.find((_s) => _s._id === s._id));
        state.originQueue = [];
      }
    },
    toggleRepeat(state) {
      state.repeat = (state.repeat + 1) % 3;
      if (state.repeat === 1 && state.history.length === 0 && state.queue.length === 0) {
        // the only one to repeat
        state.repeat = 2;
      }
    },
    nextTrack(state, payload: PayloadAction<{ skip?: number; isUser?: boolean } | undefined>) {
      const skip = payload.payload?.skip ?? 0;
      const isUser = payload.payload?.isUser ?? false;

      if (
        state.repeat === 2 // repeat one or repeat all with one
      ) {
        // turn off repeat when user next track in Repeat1 mode.
        if (isUser) state.repeat = 0;
        else return;
      }

      if (state.repeat === 1 && state.queue.length === 0 && state.playingTrack) {
        console.log("REPEAT QUEUE");
        // repeat from the beginning
        state.queue = [...state.history.slice(1), state.playingTrack];

        state.playingTrack = state.history[0] ?? state.playingTrack;
        state.chapters = isVideo(state.playingTrack) ? (state.playingTrack.chapters ?? []) : [];

        state.history = [];
        return;
      }

      if (state.playingTrack != null)
        state.history = [...state.history, state.playingTrack, ...state.queue.slice(0, skip)];

      state.playingTrack = state.queue[skip];
      state.chapters = isVideo(state.playingTrack) ? (state.playingTrack.chapters ?? []) : [];

      state.queue = state.queue.slice(skip + 1);
    },
    prevTrack(state, payload: PayloadAction<{ skip?: number } | undefined>) {
      const skip = payload.payload?.skip ?? 0;

      if (
        state.repeat === 2 // repeat one or repeat all with one
      ) {
        // turn off repeat when user prev track in Repeat1 mode.
        state.repeat = 0;
      }

      if (state.playingTrack != null)
        state.queue = [...state.history.slice(-1 - skip, -1), state.playingTrack, ...state.queue];

      state.playingTrack = state.history.at(-1 - skip) ?? null;
      state.chapters = isVideo(state.playingTrack) ? (state.playingTrack.chapters ?? []) : [];

      state.history = state.history.slice(0, -1 - skip);
    },
    deleteTrack(state, payload: PayloadAction<{ songId: string }>) {
      state.queue = state.queue.filter((s) => s._id !== payload.payload.songId);
    },
    setCurrentChapter(
      state,
      payload: PayloadAction<{
        chapterIdx: number | null;
        duration?: number;
      }>
    ) {
      state.currentChapterIdx = payload.payload.chapterIdx;
      state.currentChapterDuration = payload.payload.duration ?? 0;
    }
  }
});

export const {
  nextTrack,
  prevTrack,
  deleteTrack,
  reset,
  toggleShuffleQueue,
  toggleRepeat,
  setCurrentChapter
} = playerSlice.actions;

export default playerSlice.reducer;
