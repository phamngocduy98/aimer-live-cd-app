import { ThunkAction, UnknownAction } from "@reduxjs/toolkit";
import { nextTrack } from "../store/playerSlice";
import { videoOnSeek } from "../store/playerVideoControl";
import type { RootState } from "@app/store";
import { store } from "@app/store";

export const onNextTrack =
  (
    props: { skip?: number; isUser?: boolean } | undefined
  ): ThunkAction<void, RootState, unknown, UnknownAction> =>
  async (dispatch) => {
    const skip = props?.skip ?? 0;
    const isUser = props?.isUser ?? false;
    const player = store.getState().player;
    if (skip === 0 && isUser && player.chapters.length > 0 && player.currentChapterIdx != null) {
      const nextChapter = player.chapters[player.currentChapterIdx + 1];
      if (nextChapter != null) {
        // next chapter;
        dispatch(videoOnSeek({ position: nextChapter.time }));
        return;
      }
    }

    dispatch(nextTrack(props));
  };
