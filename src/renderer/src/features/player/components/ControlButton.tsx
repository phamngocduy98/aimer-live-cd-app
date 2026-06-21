import {
  PauseRounded,
  PlayArrowRounded,
  Repeat,
  RepeatOne,
  Shuffle,
  SkipNext,
  SkipPrevious,
  StopRounded
} from "@mui/icons-material";
import { Box, CircularProgress, IconButton, useTheme } from "@mui/material";
import { useGlobalAudioPlayer } from "react-use-audio-player";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { setRadioListening, toggleRepeat, toggleShuffleQueue } from "../store/playerSlice";
import { stopVideo, togglePlayPauseVideo } from "../store/playerVideoControl";
import { onNextTrack } from "../thunks/onNextTrack";
import { onPrevTrack } from "../thunks/onPrevTrack";

export const ControlButton = () => {
  const dispatch = useAppDispatch();
  const { history, queue, originQueue, repeat, playingTrack, currentChapterIdx, chapters } =
    useAppSelector((state) => state.player);
  const radio = useAppSelector((state) => state.player.radio);

  const expandedPlayerOpen = useAppSelector((state) => state.playerGui.expandedPlayer);

  const canNext = queue.length > 0 || (currentChapterIdx ?? -1) < chapters.length - 1;
  const canPrev = history.length > 0 || (currentChapterIdx ?? -1) > 0;

  const { togglePlayPause, isReady, isLoading, playing, stop } = useGlobalAudioPlayer();

  const { videoPlaying, videoIsLoading, videoIsReady } = useAppSelector(
    (state) => state.playerVideoControl
  );

  const _isLoading = radio.enabled
    ? false
    : playingTrack?.type === "video"
      ? videoIsLoading
      : isLoading;
  const _isReady = radio.enabled ? true : playingTrack?.type === "video" ? videoIsReady : isReady;
  const _playing = radio.enabled
    ? radio.listening && (playingTrack?.type === "video" ? videoPlaying : playing)
    : playingTrack?.type === "video"
      ? videoPlaying
      : playing;

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
          xs: expandedPlayerOpen ? "space-between" : "center",
          sm: "center"
        },
        gap: { sm: 0.25, md: 0.75 },
        order: { xs: expandedPlayerOpen ? 1 : 0, sm: 0 }
      }}
    >
      <IconButton
        disabled={radio.enabled}
        aria-label="shuffle"
        onClick={(e) => {
          e.stopPropagation();
          dispatch(toggleShuffleQueue());
        }}
        size="medium"
        sx={{
          "&:hover": {
            backgroundColor: !radio.enabled && originQueue.length > 0 ? "#fcfcfc29" : undefined
          },
          backgroundColor: !radio.enabled && originQueue.length > 0 ? "#fcfcfc29" : undefined,
          display: {
            xs: radio.enabled || !expandedPlayerOpen ? "none" : "inline-flex",
            sm: radio.enabled ? "none" : "inline-flex"
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
        disabled={radio.enabled || !canPrev}
        aria-label="previous song"
        onClick={(e) => {
          e.stopPropagation();
          dispatch(onPrevTrack());
        }}
        size="medium"
        sx={{
          display: {
            xs: expandedPlayerOpen ? "inline-flex" : "none",
            sm: "inline-flex"
          },
          fontSize: {
            xs: "40px",
            sm: "28px"
          },
          width: { xs: expandedPlayerOpen ? 54 : 42, sm: 48 },
          height: { xs: expandedPlayerOpen ? 54 : 42, sm: 48 },
          p: 0
        }}
      >
        <SkipPrevious
          fontSize="inherit"
          htmlColor={!radio.enabled && canPrev ? mainIconColor : disabledIconColor}
        />
      </IconButton>
      <IconButton
        aria-label={
          radio.enabled ? (radio.listening ? "stop" : "play") : !_playing ? "play" : "pause"
        }
        onClick={(e) => {
          e.stopPropagation();

          if (radio.enabled) {
            if (radio.listening) {
              dispatch(setRadioListening(false));
              if (playingTrack?.type === "video") {
                dispatch(stopVideo());
              } else {
                stop();
              }
            } else {
              dispatch(setRadioListening(true));
            }
            return;
          }

          if (playingTrack?.type === "video") {
            dispatch(togglePlayPauseVideo());
          } else {
            togglePlayPause();
          }
        }}
        size="medium"
        sx={{
          fontSize: {
            xs: "42px",
            sm: "36px"
          },
          width: { xs: expandedPlayerOpen ? 56 : 44, sm: 48 },
          height: { xs: expandedPlayerOpen ? 56 : 44, sm: 48 },
          p: 0
        }}
      >
        {!_isReady || _isLoading ? (
          <CircularProgress size={expandedPlayerOpen ? 36 : 26} thickness={4} />
        ) : radio.enabled && radio.listening ? (
          <StopRounded fontSize="inherit" htmlColor={mainIconColor} />
        ) : !_playing ? (
          <PlayArrowRounded fontSize="inherit" htmlColor={mainIconColor} />
        ) : (
          <PauseRounded fontSize="inherit" htmlColor={mainIconColor} />
        )}
      </IconButton>
      <IconButton
        disabled={radio.enabled || !canNext}
        aria-label="next song"
        onClick={(e) => {
          e.stopPropagation();
          dispatch(onNextTrack({ isUser: true }));
        }}
        size="medium"
        sx={{
          fontSize: {
            xs: expandedPlayerOpen ? "40px" : "28px",
            sm: "28px"
          },
          width: { xs: expandedPlayerOpen ? 54 : 42, sm: 48 },
          height: { xs: expandedPlayerOpen ? 54 : 42, sm: 48 },
          p: 0
        }}
      >
        <SkipNext
          fontSize="inherit"
          htmlColor={!radio.enabled && canNext ? mainIconColor : disabledIconColor}
        />
      </IconButton>
      <IconButton
        disabled={radio.enabled}
        aria-label="repeat"
        onClick={(e) => {
          e.stopPropagation();
          dispatch(toggleRepeat());
        }}
        size="medium"
        sx={{
          "&:hover": {
            backgroundColor: !radio.enabled && repeat > 0 ? "#fcfcfc29" : undefined
          },
          backgroundColor: !radio.enabled && repeat > 0 ? "#fcfcfc29" : undefined,
          display: {
            xs: radio.enabled || !expandedPlayerOpen ? "none" : "inline-flex",
            sm: radio.enabled ? "none" : "inline-flex"
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
