import type { AppDispatch, RootState } from "@app/store";
import type { Video } from "@features/library";
import { showSubscriptionPrompt } from "@features/auth/store/authSlice";
import { playContext, setCurrentChapter } from "../store/playerSlice";
import { videoOnSeek } from "../store/playerVideoControl";
import type { PlaySource } from "../types";

export const playVideoChapter =
  (video: Video, playFrom: PlaySource, chapterIndex: number) =>
  (dispatch: AppDispatch, getState: () => RootState) => {
    const chapter = video.chapters[chapterIndex] ?? video.chapters[0];
    if (!chapter) return;
    if (!getState().auth.session.canAccessPaidMedia && !video.youtubeUrl) {
      dispatch(showSubscriptionPrompt(video));
      return;
    }
    const nextChapterTime = video.chapters[chapterIndex + 1]?.time ?? video.duration;

    dispatch(playContext({ items: [video], playFrom }));
    dispatch(
      setCurrentChapter({
        chapterIdx: chapterIndex,
        duration: Math.max(0, nextChapterTime - chapter.time)
      })
    );
    dispatch(videoOnSeek({ position: chapter.time, mediaId: video._id }));
  };
