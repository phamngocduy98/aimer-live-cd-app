import { ThunkAction, UnknownAction } from "@reduxjs/toolkit";
import { isVideo } from "../../core/Video";
import { nextTrack, setCurrentChapter } from "../player/playerSlice";
import { videoOnProgress, videoOnSeek } from "../player/playerVideoControl";
import { RootState, store } from "../store";

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
