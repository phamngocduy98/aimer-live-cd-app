import {
  PauseRounded,
  PlayArrowRounded,
  Repeat,
  RepeatOne,
  Shuffle,
  SkipNext,
  SkipPrevious
} from "@mui/icons-material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";
import { Box, CircularProgress, IconButton, Slider, Typography } from "@mui/material";
import React from "react";
import { useGlobalAudioPlayer } from "react-use-audio-player";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { isVideo } from "@features/library";
import { formatDuration } from "@utils/formatDuration";
import { toggleRepeat, toggleShuffleQueue } from "../store/playerSlice";
import { togglePlayPauseVideo, videoOnSeek } from "../store/playerVideoControl";
import { onNextTrack } from "../thunks/onNextTrack";
import { onPrevTrack } from "../thunks/onPrevTrack";
import { toggleView } from "../store/playerGuiSlice";
import { SongActionsMenu } from "@components/media/MediaActionsMenu";
import { LyricsLanguageButton } from "@features/lyrics";

export function ExpandedMobileControls() {
  const dispatch = useAppDispatch();
  const lyricsOpen = useAppSelector((state) => state.playerGui.lyrics);
  const [optionsOpen, setOptionsOpen] = React.useState(false);
  const {
    playingTrack,
    currentChapterDuration,
    currentChapterIdx,
    chapters,
    history,
    queue,
    originQueue,
    repeat
  } = useAppSelector((state) => state.player);
  const currentChapter = chapters[currentChapterIdx ?? -1];
  const { seek, isReady, isLoading, playing, togglePlayPause, getPosition } =
    useGlobalAudioPlayer();
  const audioPosition = useAudioPosition(getPosition);
  const { videoPosition, videoIsReady, videoIsLoading, videoPlaying } = useAppSelector(
    (state) => state.playerVideoControl
  );

  const video = isVideo(playingTrack);
  const position = video
    ? currentChapter
      ? videoPosition - currentChapter.time
      : videoPosition
    : audioPosition;
  const duration = currentChapter
    ? currentChapterDuration
    : Math.max(playingTrack?.duration ?? 0, 0);
  const ready = video ? videoIsReady : isReady;
  const [dragPosition, setDragPosition] = React.useState<number | null>(null);
  const sliderPosition = dragPosition ?? Math.min(Math.max(position, 0), duration);
  const loading = video ? videoIsLoading : isLoading;
  const isPlaying = video ? videoPlaying : playing;
  const canPrevious = history.length > 0 || (currentChapterIdx ?? -1) > 0;
  const canNext = queue.length > 0 || (currentChapterIdx ?? -1) < chapters.length - 1;

  const handleSeek = (value: number) => {
    const nextPosition = (currentChapter?.time ?? 0) + value;
    if (video) {
      dispatch(videoOnSeek({ position: nextPosition }));
    } else {
      seek(nextPosition);
    }
  };

  return (
    <Box data-testid="expanded-mobile-controls" sx={{ px: 2, pb: 0.5 }}>
      <Slider
        aria-label="Playback position"
        size="small"
        value={sliderPosition}
        min={0}
        max={Math.max(Math.floor(duration), 1)}
        step={1}
        disabled={!ready}
        onChange={(_, value) => setDragPosition(value as number)}
        onChangeCommitted={(_, value) => {
          setDragPosition(null);
          handleSeek(value as number);
        }}
        sx={{
          display: "block",
          width: "100%",
          height: 4,
          p: "8px 0",
          color: "#fff",
          "& .MuiSlider-thumb": { width: 9, height: 9 },
          "& .MuiSlider-rail": { opacity: 0.3 }
        }}
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.25 }}>
        <TimeLabel>{formatDuration(sliderPosition)}</TimeLabel>
        <TimeLabel>-{formatDuration(Math.max(duration - sliderPosition, 0))}</TimeLabel>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          alignItems: "center",
          mt: 2.75
        }}
      >
        <ControlIcon
          label="shuffle"
          active={originQueue.length > 0}
          onClick={() => dispatch(toggleShuffleQueue())}
        >
          <Shuffle />
        </ControlIcon>
        <ControlIcon
          label="previous song"
          disabled={!canPrevious}
          iconSize={32}
          onClick={() => dispatch(onPrevTrack())}
        >
          <SkipPrevious />
        </ControlIcon>
        <IconButton
          aria-label={isPlaying ? "pause" : "play"}
          onClick={() => (video ? dispatch(togglePlayPauseVideo()) : togglePlayPause())}
          sx={{ width: 68, height: 68, mx: "auto", color: "#fff" }}
        >
          {!ready || loading ? (
            <CircularProgress size={40} thickness={4} color="inherit" />
          ) : isPlaying ? (
            <PauseRounded sx={{ fontSize: 54 }} />
          ) : (
            <PlayArrowRounded sx={{ fontSize: 58 }} />
          )}
        </IconButton>
        <ControlIcon
          label="next song"
          disabled={!canNext}
          iconSize={32}
          onClick={() => dispatch(onNextTrack({ isUser: true }))}
        >
          <SkipNext />
        </ControlIcon>
        <ControlIcon label="repeat" active={repeat > 0} onClick={() => dispatch(toggleRepeat())}>
          {repeat === 2 ? <RepeatOne /> : <Repeat />}
        </ControlIcon>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2.75 }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          {lyricsOpen && <LyricsLanguageButton size={50} />}
          <IconButton
            aria-label="Playing queue"
            onClick={() => dispatch(toggleView("playingQueue"))}
            sx={{
              width: 50,
              height: 50,
              bgcolor: "rgba(255,255,255,.12)",
              "&:hover": { bgcolor: "rgba(255,255,255,.16)" }
            }}
          >
            <QueueMusicRoundedIcon />
          </IconButton>
        </Box>
        <IconButton
          aria-label="Player options"
          onClick={() => setOptionsOpen(true)}
          sx={{
            width: 50,
            height: 50,
            bgcolor: "rgba(255,255,255,.12)",
            "&:hover": { bgcolor: "rgba(255,255,255,.16)" }
          }}
        >
          <MoreHorizIcon />
        </IconButton>
      </Box>
      <SongActionsMenu
        track={playingTrack}
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
      />
    </Box>
  );
}

interface ControlIconProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  iconSize?: number;
  onClick: () => void;
  children: React.ReactNode;
}

function ControlIcon({
  label,
  active,
  disabled,
  iconSize = 25,
  onClick,
  children
}: ControlIconProps) {
  return (
    <IconButton
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      sx={{
        width: 48,
        height: 48,
        mx: "auto",
        color: active ? "primary.main" : "#fff",
        opacity: disabled ? 0.35 : 1,
        "& .MuiSvgIcon-root": { fontSize: iconSize }
      }}
    >
      {children}
    </IconButton>
  );
}

function useAudioPosition(getPosition: () => number) {
  const [position, setPosition] = React.useState(0);

  React.useEffect(() => {
    let frame: number;
    const update = () => {
      setPosition(getPosition());
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [getPosition]);

  return position;
}

function TimeLabel({ children }: React.PropsWithChildren) {
  return (
    <Typography
      component="span"
      sx={{ color: "rgba(255,255,255,.68)", fontSize: 12, fontWeight: 700, lineHeight: 1.4 }}
    >
      {children}
    </Typography>
  );
}
