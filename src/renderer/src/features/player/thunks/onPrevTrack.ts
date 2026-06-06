import { ThunkAction, UnknownAction } from "@reduxjs/toolkit";
import { prevTrack } from "../store/playerSlice";
import { videoOnSeek } from "../store/playerVideoControl";
import type { RootState } from "@app/store";
import { store } from "@app/store";

export const onPrevTrack =
  (
    props: { skip?: number } | undefined = undefined
  ): ThunkAction<void, RootState, unknown, UnknownAction> =>
  async (dispatch) => {
    const skip = props?.skip ?? 0;
    const player = store.getState().player;
    if (skip === 0 && player.chapters.length > 0 && player.currentChapterIdx != null) {
      const prevChapter = player.chapters[player.currentChapterIdx - 1];
      if (prevChapter != null) {
        // next chapter;
        dispatch(videoOnSeek({ position: prevChapter.time }));
        return;
      }
    }

    dispatch(prevTrack(props));
  };
