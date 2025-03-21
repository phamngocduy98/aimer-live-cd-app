import { Box, Slider, styled, Typography, useTheme } from "@mui/material";
import { useGlobalAudioPlayer } from "react-use-audio-player";
import { formatDuration } from "../../utils/formatDuration";
import React from "react";
import { useAppDispatch, useAppSelector } from "../../store/hook";
import Grid from "@mui/material/Unstable_Grid2";
import { videoOnSeek } from "../../store/player/playerVideoControl";
import { isVideo } from "../../core/Video";

export function PlayingSlider() {
  const dispatch = useAppDispatch();
  const showMobilePlayer = useAppSelector((state) => state.playerGui.mobilePlayer);
  const { playingTrack, currentChapterDuration } = useAppSelector((state) => state.player);

  const currentChapter = useAppSelector(
    (state) => state.player.chapters[state.player.currentChapterIdx ?? -1]
  );
  const { seek, duration, isReady } = useGlobalAudioPlayer();
  const position = useAudioTime();
  const theme = useTheme();

  const { videoPosition, videoIsReady } = useAppSelector((state) => state.playerVideoControl);

  const _position = isVideo(playingTrack)
    ? currentChapter != null
      ? videoPosition - currentChapter.time
      : videoPosition
    : position;
  const _duration = currentChapter != null ? currentChapterDuration : (playingTrack?.duration ?? 0);
  const _remain = _duration - _position;
  const _isReady = isVideo(playingTrack) ? videoIsReady : isReady;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Grid
        container
        alignItems="center"
        justifyContent="center"
        spacing={2}
        sx={{
          display: { xs: showMobilePlayer ? "flex" : "none", sm: "flex" },
          order: { xs: showMobilePlayer ? 0 : 1, sm: 1 },
          margin: "0 4px"
        }}
      >
        <Grid
          xs={showMobilePlayer ? 6 : "auto"}
          sm={"auto"}
          sx={{
            padding: {
              xs: undefined,
              sm: 0
            },
            order: {
              xs: showMobilePlayer ? 1 : 0,
              sm: 0
            }
          }}
        >
          <TinyText>{formatDuration(_position)}</TinyText>
        </Grid>
        <Grid
          xs={showMobilePlayer ? 12 : true}
          sm
          order={showMobilePlayer ? 0 : 1}
          display={"flex"}
          alignItems={"center"}
          sx={{
            order: {
              xs: showMobilePlayer ? 0 : 1,
              sm: 1
            }
          }}
        >
          <Slider
            size="small"
            value={Math.floor(_position)}
            min={0}
            step={1}
            disabled={!_isReady}
            max={Math.floor(_duration)}
            onChange={(e, value) => {
              e.stopPropagation();
              const newPos =
                (currentChapter != null ? currentChapter?.time : 0) + (value as number);
              playingTrack?.type === "video"
                ? dispatch(videoOnSeek({ position: newPos }))
                : seek(newPos);
              // console.log("seek", value);
            }}
            sx={{
              color: theme.palette.mode === "dark" ? "#fff" : "rgba(0,0,0,0.87)",
              height: 4,
              padding: "0 !important",
              "& .MuiSlider-thumb": {
                width: 8,
                height: 8,
                transition: "0.3s cubic-bezier(.47,1.64,.41,.8)",
                "&:before": {
                  boxShadow: "0 2px 12px 0 rgba(0,0,0,0.4)"
                },
                "&:hover, &.Mui-focusVisible": {
                  boxShadow: `0px 0px 0px 8px ${
                    theme.palette.mode === "dark" ? "rgb(255 255 255 / 16%)" : "rgb(0 0 0 / 16%)"
                  }`
                },
                "&.Mui-active": {
                  width: 20,
                  height: 20
                }
              },
              "& .MuiSlider-rail": {
                opacity: 0.28
              }
            }}
          />
        </Grid>
        <Grid
          xs={showMobilePlayer ? 6 : "auto"}
          sm={"auto"}
          order={2}
          sx={{
            padding: {
              xs: undefined,
              sm: 0
            }
          }}
        >
          <TinyText align="right">-{formatDuration(_remain)}</TinyText>
        </Grid>
      </Grid>
    </div>
  );
}

function useAudioTime() {
  const frameRef = React.useRef<number>();
  const [pos, setPos] = React.useState(0);
  const { getPosition } = useGlobalAudioPlayer();

  React.useEffect(() => {
    const animate = () => {
      setPos(getPosition());
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [getPosition]);

  return pos;
}

const TinyText = styled(Typography)({
  fontSize: "10px",
  fontWeight: 600,
  letterSpacing: "1.2px",
  lineHeight: "16px",
  color: "#ffffff99",
  textTransform: "uppercase"
});
