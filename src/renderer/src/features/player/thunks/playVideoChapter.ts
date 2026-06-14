import type { AppDispatch } from "@app/store";
import type { Video } from "@features/library";
import { playContext, setCurrentChapter } from "../store/playerSlice";
import { videoOnSeek } from "../store/playerVideoControl";
import type { PlaySource } from "../types";

export const playVideoChapter =
  (video: Video, playFrom: PlaySource, chapterIndex: number) => (dispatch: AppDispatch) => {
    const chapter = video.chapters[chapterIndex] ?? video.chapters[0];
    if (!chapter) return;
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
