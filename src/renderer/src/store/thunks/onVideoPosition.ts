import { ThunkAction, UnknownAction } from "@reduxjs/toolkit";
import { isVideo } from "../../core/Video";
import { setCurrentChapter } from "../player/playerSlice";
import { videoOnProgress } from "../player/playerVideoControl";
import { RootState, store } from "../store";

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
