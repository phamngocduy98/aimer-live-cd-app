import { VolumeOffRounded, VolumeUpRounded } from "@mui/icons-material";
import { Box, ClickAwayListener, IconButton, Slider, useMediaQuery, useTheme } from "@mui/material";
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
  const touchControls = useMediaQuery("(hover: none), (pointer: coarse)");
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
    <ClickAwayListener onClickAway={() => touchControls && setOpen(false)}>
      <Box
        onMouseEnter={() => {
          if (!touchControls) setOpen(true);
        }}
        onMouseLeave={() => {
          if (!touchControls) setOpen(false);
        }}
        onClick={(event) => event.stopPropagation()}
        sx={{
          position: "relative",
          display: "flex",
          zIndex: open ? 2 : "auto",
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
        <IconButton
          aria-label={touchControls ? "Open volume" : muted ? "Unmute" : "Mute"}
          onClick={() => {
            if (touchControls) {
              setOpen((isOpen) => !isOpen);
              return;
            }
            toggleMute();
          }}
        >
          {muted ? <VolumeOffRounded /> : <VolumeUpRounded />}
        </IconButton>
        <Box
          sx={{
            position: "absolute",
            zIndex: 10,
            bottom: "calc(100% + 8px)",
            left: "50%",
            width: 42,
            height: 136,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pt: "14px",
            pb: "18px",
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
              width: 20,
              color: theme.palette.mode === "dark" ? "#fff" : "rgba(0,0,0,0.87)",
              "& .MuiSlider-track, & .MuiSlider-rail": {
                left: "50%",
                width: 6,
                border: "none",
                borderRadius: 999,
                transform: "translateX(-50%)"
              },
              "& .MuiSlider-rail": { opacity: 0.3 },
              "& .MuiSlider-thumb": {
                left: "50%",
                width: 16,
                height: 16,
                backgroundColor: "#fff",
                transform: "translate(-50%, 50%)",
                "&:hover, &.Mui-focusVisible, &.Mui-active": { boxShadow: "none" }
              }
            }}
          />
        </Box>
      </Box>
    </ClickAwayListener>
  );
};
