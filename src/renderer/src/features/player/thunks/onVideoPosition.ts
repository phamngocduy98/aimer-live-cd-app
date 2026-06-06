import { ThunkAction, UnknownAction } from "@reduxjs/toolkit";
import { isVideo } from "@features/library";
import { setCurrentChapter } from "../store/playerSlice";
import { videoOnProgress } from "../store/playerVideoControl";
import type { RootState } from "@app/store";
import { store } from "@app/store";

export const onVideoPostion =
  (position: number): ThunkAction<void, RootState, unknown, UnknownAction> =>
  async (dispatch) => {
    dispatch(videoOnProgress({ position }));
    const { player, playerVideoControl } = store.getState();
    if (player.playingTrack && isVideo(player.playingTrack) && player.chapters.length > 0) {
      let idx = player.playingTrack.chapters.findIndex(
        (c) => c.time > playerVideoControl.videoPosition
      );
      if (idx === -1) idx = player.chapters.length;
      const nextChapterTime =
        player.playingTrack.chapters[idx]?.time ?? player.playingTrack.duration;
      const currentChapterIdx = idx - 1;
      const currentChapter = player.playingTrack.chapters[currentChapterIdx];
      dispatch(
        setCurrentChapter({
          chapterIdx: currentChapterIdx,
          duration: currentChapter ? nextChapterTime - currentChapter.time : 0
        })
      );
    }
  };
