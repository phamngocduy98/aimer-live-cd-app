import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";
import type { IVideoChapter, Song, Video } from "@features/library/types";
import { isVideo } from "@features/library/types";
import { shuffleArray } from "@utils/shuffleArray";
import type { PlayContextPayload, QueueEntry } from "../types";
import { mediaType, sourceItemKey } from "../types";

type MSong = Song | Video;

interface PlayerSlice {
  currentEntry: QueueEntry | null;
  playingTrack: MSong | null;
  queue: QueueEntry[];
  originQueue: QueueEntry[];
  history: QueueEntry[];
  repeat: number; // 0, 1, 2
  chapters: IVideoChapter[];
  currentChapterIdx: number | null;
  currentChapterDuration: number;
  favoriteTrackIds: string[];
}

const playerSlice = createSlice({
  name: "player",
  initialState: {
    currentEntry: null,
    playingTrack: null,
    queue: [],
    originQueue: [],
    history: [],
    repeat: 0,
    chapters: [],
    currentChapterIdx: null,
    currentChapterDuration: 0,
    favoriteTrackIds: []
  } satisfies PlayerSlice as PlayerSlice,
  reducers: {
    playContext(state, action: PayloadAction<PlayContextPayload>) {
      const { items, playFrom, startIndex = 0, shuffle = false, sourceItemKeys } = action.payload;
      const entries = items.map((item, index) => {
        const type = mediaType(item);
        const media = { ...item, type } as MSong;
        return {
          queueEntryId: nanoid(),
          media,
          playFrom,
          sourceItemKey: sourceItemKeys?.[index] ?? sourceItemKey(playFrom, media, index)
        };
      });
      const ordered = shuffle ? shuffleArray(entries) : entries;
      const selectedIndex = shuffle ? 0 : Math.min(Math.max(startIndex, 0), ordered.length - 1);

      state.currentEntry = ordered[selectedIndex] ?? null;
      state.playingTrack = state.currentEntry?.media ?? null;
      state.history = ordered.slice(0, selectedIndex);
      state.queue = ordered.slice(selectedIndex + 1);
      state.originQueue = shuffle ? entries : [];
      state.chapters = isVideo(state.playingTrack) ? (state.playingTrack.chapters ?? []) : [];
      state.currentChapterIdx = null;
      state.currentChapterDuration = 0;
    },
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

      const playFrom = { type: "home" as const, label: "Queue", route: "/" };
      const entries = songs.map((media, index) => ({
        queueEntryId: nanoid(),
        media,
        playFrom,
        sourceItemKey: sourceItemKey(playFrom, media, index)
      }));
      const history = (payload.payload.history ?? []).map((media, index) => ({
        queueEntryId: nanoid(),
        media,
        playFrom,
        sourceItemKey: sourceItemKey(playFrom, media, index)
      }));

      state.currentEntry = entries[0] ?? null;
      state.playingTrack = state.currentEntry?.media ?? null;
      state.chapters = isVideo(state.playingTrack) ? (state.playingTrack.chapters ?? []) : [];

      state.queue = entries.slice(1);
      if (payload.payload.shuffle) state.originQueue = entries;
      else state.originQueue = [];
      state.history = history;
    },
    toggleShuffleQueue(state) {
      if (state.originQueue.length === 0) {
        console.log("shuffle ON");
        state.originQueue = state.queue;
        state.queue = shuffleArray(state.queue);
      } else {
        console.log("shuffle OFF");
        state.queue = state.originQueue.filter((entry) =>
          state.queue.find((_entry) => _entry.queueEntryId === entry.queueEntryId)
        );
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
        state.queue = [...state.history.slice(1), state.currentEntry].filter(
          (entry): entry is QueueEntry => Boolean(entry)
        );

        state.currentEntry = state.history[0] ?? state.currentEntry;
        state.playingTrack = state.currentEntry?.media ?? null;
        state.chapters = isVideo(state.playingTrack) ? (state.playingTrack.chapters ?? []) : [];

        state.history = [];
        return;
      }

      if (state.currentEntry != null)
        state.history = [...state.history, state.currentEntry, ...state.queue.slice(0, skip)];

      state.currentEntry = state.queue[skip] ?? null;
      state.playingTrack = state.currentEntry?.media ?? null;
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

      if (state.currentEntry != null)
        state.queue = [...state.history.slice(-1 - skip, -1), state.currentEntry, ...state.queue];

      state.currentEntry = state.history.at(-1 - skip) ?? null;
      state.playingTrack = state.currentEntry?.media ?? null;
      state.chapters = isVideo(state.playingTrack) ? (state.playingTrack.chapters ?? []) : [];

      state.history = state.history.slice(0, -1 - skip);
    },
    deleteTrack(state, payload: PayloadAction<{ queueEntryId: string }>) {
      state.queue = state.queue.filter(
        (entry) => entry.queueEntryId !== payload.payload.queueEntryId
      );
    },
    toggleFavorite(state, payload: PayloadAction<{ trackId: string }>) {
      const index = state.favoriteTrackIds.indexOf(payload.payload.trackId);
      if (index >= 0) state.favoriteTrackIds.splice(index, 1);
      else state.favoriteTrackIds.push(payload.payload.trackId);
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
  playContext,
  nextTrack,
  prevTrack,
  deleteTrack,
  toggleFavorite,
  reset,
  toggleShuffleQueue,
  toggleRepeat,
  setCurrentChapter
} = playerSlice.actions;

export default playerSlice.reducer;
