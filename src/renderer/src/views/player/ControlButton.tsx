import {
  FastForwardRounded,
  FastRewindRounded,
  PauseRounded,
  PlayArrowRounded,
  Repeat,
  RepeatOne,
  Shuffle,
  SkipNext,
  SkipPrevious
} from "@mui/icons-material";
import { Box, CircularProgress, IconButton, useTheme } from "@mui/material";
import { useGlobalAudioPlayer } from "react-use-audio-player";
import { useAppDispatch, useAppSelector } from "../../store/hook";
import {
  nextTrack,
  prevTrack,
  toggleRepeat,
  toggleShuffleQueue
} from "../../store/player/playerSlice";
import styled from "@emotion/styled";
import { togglePlayPauseVideo } from "../../store/player/playerVideoControl";
import { onNextTrack } from "../../store/thunks/onNextTrack";
import { onPrevTrack } from "../../store/thunks/onPrevTrack";

export const ControlButton = () => {
  const dispatch = useAppDispatch();
  const { history, queue, originQueue, repeat, playingTrack, currentChapterIdx, chapters } =
    useAppSelector((state) => state.player);

  const showMobilePlayer = useAppSelector((state) => state.playerGui.mobilePlayer);

  const canNext = queue.length > 0 || (currentChapterIdx ?? -1) < chapters.length;
  const canPrev = history.length > 0 || (currentChapterIdx ?? -1) > 0;

  const { togglePlayPause, isReady, isLoading, playing } = useGlobalAudioPlayer();

  const { videoVolume, videoUrl, videoPlaying, videoLoop, videoIsLoading, videoIsReady } =
    useAppSelector((state) => state.playerVideoControl);

  const _isLoading = playingTrack?.type === "video" ? videoIsLoading : isLoading;
  const _isReady = playingTrack?.type === "video" ? videoIsReady : isReady;
  const _playing = playingTrack?.type === "video" ? videoPlaying : playing;

  const theme = useTheme();
  const mainIconColor = theme.palette.mode === "dark" ? "#fff" : "#000";
  const disabledIconColor = theme.palette.mode === "dark" ? "#ffffff6e" : "#0000006e";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: {
          xs: showMobilePlayer ? "space-between" : "center",
          sm: "center"
        },
        order: { xs: showMobilePlayer ? 1 : 0, sm: 0 }
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <IconButton
        aria-label="shuffle"
        onClick={(e) => {
          e.stopPropagation();
          dispatch(toggleShuffleQueue());
        }}
        size="medium"
        sx={{
          "&:hover": {
            backgroundColor: originQueue.length > 0 ? "#fcfcfc29" : undefined
          },
          backgroundColor: originQueue.length > 0 ? "#fcfcfc29" : undefined,
          display: {
            xs: showMobilePlayer ? "inline-flex" : "none",
            sm: "inline-flex"
          },
          fontSize: {
            xs: "24px",
            sm: "16px"
          }
        }}
      >
        <Shuffle fontSize="inherit" />
      </IconButton>
      <IconButton
        disabled={!canPrev}
        aria-label="previous song"
        onClick={(e) => {
          e.stopPropagation();
          dispatch(onPrevTrack());
        }}
        size="medium"
        sx={{
          display: {
            xs: showMobilePlayer ? "inline-flex" : "none",
            sm: "inline-flex"
          },
          fontSize: {
            xs: "35px",
            sm: "24px"
          }
        }}
      >
        <SkipPrevious fontSize="inherit" htmlColor={canPrev ? mainIconColor : disabledIconColor} />
      </IconButton>
      <IconButton
        aria-label={!_playing ? "play" : "pause"}
        onClick={(e) => {
          e.stopPropagation();

          playingTrack?.type === "video" ? dispatch(togglePlayPauseVideo()) : togglePlayPause();
        }}
        size="medium"
        sx={{
          fontSize: {
            xs: "50px",
            sm: "40px"
          }
        }}
      >
        {!_isReady || _isLoading ? (
          <CircularProgress />
        ) : !_playing ? (
          <PlayArrowRounded fontSize="inherit" htmlColor={mainIconColor} />
        ) : (
          <PauseRounded fontSize="inherit" htmlColor={mainIconColor} />
        )}
      </IconButton>
      <IconButton
        disabled={!canNext}
        aria-label="next song"
        onClick={(e) => {
          e.stopPropagation();
          dispatch(onNextTrack({ isUser: true }));
        }}
        size="medium"
        sx={{
          fontSize: {
            xs: showMobilePlayer ? "35px" : "24px",
            sm: "24px"
          }
        }}
      >
        <SkipNext fontSize="inherit" htmlColor={canNext ? mainIconColor : disabledIconColor} />
      </IconButton>
      <IconButton
        aria-label="repeat"
        onClick={(e) => {
          e.stopPropagation();
          dispatch(toggleRepeat());
        }}
        size="medium"
        sx={{
          "&:hover": {
            backgroundColor: repeat > 0 ? "#fcfcfc29" : undefined
          },
          backgroundColor: repeat > 0 ? "#fcfcfc29" : undefined,
          display: {
            xs: showMobilePlayer ? "inline-flex" : "none",
            sm: "inline-flex"
          },
          fontSize: {
            xs: "24px",
            sm: "16px"
          }
        }}
      >
        {repeat === 2 ? <RepeatOne fontSize="inherit" /> : <Repeat fontSize="inherit" />}
      </IconButton>
    </Box>
  );
};
