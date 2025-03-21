import { VolumeDownRounded, VolumeUpRounded } from "@mui/icons-material";
import { Stack, Slider, useTheme, Popover, IconButton } from "@mui/material";
import { useState } from "react";
import { useGlobalAudioPlayer } from "react-use-audio-player";
import { useAppDispatch, useAppSelector } from "../../store/hook";
import { videoSetVolume } from "../../store/player/playerVideoControl";

export const VolumeController: React.FC = () => {
  const dispatch = useAppDispatch();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { volume, setVolume } = useGlobalAudioPlayer();

  const { videoVolume } = useAppSelector((state) => state.playerVideoControl);

  const { playingTrack } = useAppSelector((state) => state.player);

  const theme = useTheme();
  const lightIconColor =
    theme.palette.mode === "dark" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const _volume = playingTrack?.type === "video" ? videoVolume : volume;
  const _setVolume =
    playingTrack?.type === "video" ? (v: number) => dispatch(videoSetVolume(v)) : setVolume;
  const id = open ? "simple-popover" : undefined;

  return (
    <>
      <IconButton onClick={handleClick}>
        <VolumeUpRounded />
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center"
        }}
        transformOrigin={{
          vertical: "center",
          horizontal: "center"
        }}
      >
        <Stack
          spacing={2}
          direction="row"
          sx={{ px: 1 }}
          style={{ minWidth: 150 }}
          alignItems="center"
        >
          <VolumeDownRounded htmlColor={lightIconColor} />
          <Slider
            aria-label="Volume"
            value={_volume * 100}
            onChange={(_, value) => {
              console.log("volumn", parseFloat((Number(value) / 100).toFixed(2)));
              _setVolume(parseFloat((Number(value) / 100).toFixed(2)));
            }}
            sx={{
              color: theme.palette.mode === "dark" ? "#fff" : "rgba(0,0,0,0.87)",
              "& .MuiSlider-track": {
                border: "none"
              },
              "& .MuiSlider-thumb": {
                width: 24,
                height: 24,
                backgroundColor: "#fff",
                "&:before": {
                  boxShadow: "0 4px 8px rgba(0,0,0,0.4)"
                },
                "&:hover, &.Mui-focusVisible, &.Mui-active": {
                  boxShadow: "none"
                }
              }
            }}
          />
          <VolumeUpRounded htmlColor={lightIconColor} />
        </Stack>
      </Popover>
    </>
  );
};
