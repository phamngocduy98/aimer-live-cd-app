import {
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
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { toggleRepeat, toggleShuffleQueue } from "../store/playerSlice";
import { togglePlayPauseVideo } from "../store/playerVideoControl";
import { onNextTrack } from "../thunks/onNextTrack";
import { onPrevTrack } from "../thunks/onPrevTrack";

export const ControlButton = () => {
  const dispatch = useAppDispatch();
  const { history, queue, originQueue, repeat, playingTrack, currentChapterIdx, chapters } =
    useAppSelector((state) => state.player);

  const showMobilePlayer = useAppSelector((state) => state.playerGui.mobilePlayer);

  const canNext = queue.length > 0 || (currentChapterIdx ?? -1) < chapters.length - 1;
  const canPrev = history.length > 0 || (currentChapterIdx ?? -1) > 0;

  const { togglePlayPause, isReady, isLoading, playing } = useGlobalAudioPlayer();

  const { videoPlaying, videoIsLoading, videoIsReady } = useAppSelector(
    (state) => state.playerVideoControl
  );

  const _isLoading = playingTrack?.type === "video" ? videoIsLoading : isLoading;
  const _isReady = playingTrack?.type === "video" ? videoIsReady : isReady;
  const _playing = playingTrack?.type === "video" ? videoPlaying : playing;

  const theme = useTheme();
  const mainIconColor = theme.palette.mode === "dark" ? "#fff" : "#000";
  const disabledIconColor = theme.palette.mode === "dark" ? "#ffffff6e" : "#0000006e";

  return (
    <Box
      role="group"
      aria-label="Playback controls"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: {
          xs: showMobilePlayer ? "space-between" : "center",
          sm: "center"
        },
        gap: { sm: 0.25, md: 0.75 },
        order: { xs: showMobilePlayer ? 1 : 0, sm: 0 }
      }}
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
            sm: "15px"
          },
          p: { sm: 0.75 }
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
            xs: "40px",
            sm: "28px"
          },
          width: { xs: showMobilePlayer ? 54 : 42, sm: 48 },
          height: { xs: showMobilePlayer ? 54 : 42, sm: 48 },
          p: 0
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
            xs: "56px",
            sm: "44px"
          },
          width: { xs: showMobilePlayer ? 70 : 50, sm: 54 },
          height: { xs: showMobilePlayer ? 70 : 50, sm: 54 },
          p: 0
        }}
      >
        {!_isReady || _isLoading ? (
          <CircularProgress size={showMobilePlayer ? 42 : 32} thickness={4} />
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
            xs: showMobilePlayer ? "40px" : "28px",
            sm: "28px"
          },
          width: { xs: showMobilePlayer ? 54 : 42, sm: 48 },
          height: { xs: showMobilePlayer ? 54 : 42, sm: 48 },
          p: 0
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
            sm: "15px"
          },
          p: { sm: 0.75 }
        }}
      >
        {repeat === 2 ? <RepeatOne fontSize="inherit" /> : <Repeat fontSize="inherit" />}
      </IconButton>
    </Box>
  );
};
