import { VolumeOffRounded, VolumeUpRounded } from "@mui/icons-material";
import { Box, IconButton, Slider, useTheme } from "@mui/material";
import { useRef, useState } from "react";
import { useGlobalAudioPlayer } from "react-use-audio-player";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { videoSetVolume } from "../store/playerVideoControl";

export const VolumeController: React.FC = () => {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const previousVolume = useRef(1);
  const { volume, setVolume } = useGlobalAudioPlayer();

  const { videoVolume } = useAppSelector((state) => state.playerVideoControl);

  const { playingTrack } = useAppSelector((state) => state.player);

  const theme = useTheme();
  const _volume = playingTrack?.type === "video" ? videoVolume : volume;
  const _setVolume =
    playingTrack?.type === "video" ? (v: number) => dispatch(videoSetVolume(v)) : setVolume;
  const muted = _volume === 0;

  const toggleMute = () => {
    if (muted) {
      _setVolume(previousVolume.current || 1);
      return;
    }
    previousVolume.current = _volume;
    _setVolume(0);
  };

  return (
    <Box
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(event) => event.stopPropagation()}
      sx={{
        position: "relative",
        display: "flex",
        "&::before": {
          content: '""',
          position: "absolute",
          left: -4,
          right: -4,
          bottom: "100%",
          height: 12
        }
      }}
    >
      <IconButton aria-label={muted ? "Unmute" : "Mute"} onClick={toggleMute}>
        {muted ? <VolumeOffRounded /> : <VolumeUpRounded />}
      </IconButton>
      <Box
        sx={{
          position: "absolute",
          zIndex: 20,
          bottom: "calc(100% + 8px)",
          left: "50%",
          width: 42,
          height: 136,
          p: "14px 9px 18px",
          borderRadius: "12px",
          bgcolor: "rgba(35,35,43,.98)",
          boxShadow: "0 14px 36px rgba(0,0,0,.48)",
          opacity: open ? 1 : 0,
          visibility: open ? "visible" : "hidden",
          transform: `translate(-50%, ${open ? "0" : "8px"})`,
          transition: open
            ? "opacity 120ms ease, transform 120ms ease, visibility 0s"
            : "opacity 120ms ease, transform 120ms ease, visibility 0s 120ms",
          "&::after": {
            content: '""',
            position: "absolute",
            left: "50%",
            bottom: -7,
            width: 14,
            height: 14,
            bgcolor: "inherit",
            transform: "translateX(-50%) rotate(45deg)"
          }
        }}
      >
        <Slider
          orientation="vertical"
          aria-label="Volume"
          value={_volume * 100}
          onChange={(_, value) => {
            const nextVolume = parseFloat((Number(value) / 100).toFixed(2));
            if (nextVolume > 0) previousVolume.current = nextVolume;
            _setVolume(nextVolume);
          }}
          sx={{
            height: "100%",
            color: theme.palette.mode === "dark" ? "#fff" : "rgba(0,0,0,0.87)",
            "& .MuiSlider-track": { border: "none" },
            "& .MuiSlider-rail": { opacity: 0.35 },
            "& .MuiSlider-thumb": {
              width: 10,
              height: 10,
              backgroundColor: "#fff",
              "&:hover, &.Mui-focusVisible, &.Mui-active": { boxShadow: "none" }
            }
          }}
        />
      </Box>
    </Box>
  );
};
