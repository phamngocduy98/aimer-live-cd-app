import { Slider, styled, Typography, useTheme } from "@mui/material";
import { useGlobalAudioPlayer } from "react-use-audio-player";
import { formatDuration } from "@utils/formatDuration";
import React from "react";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import Grid from "@mui/material/Grid";
import { videoOnSeek } from "../store/playerVideoControl";
import { isVideo } from "@features/library";

export function PlayingSlider() {
  const dispatch = useAppDispatch();
  const showMobilePlayer = useAppSelector((state) => state.playerGui.mobilePlayer);
  const { playingTrack, currentChapterDuration } = useAppSelector((state) => state.player);

  const currentChapter = useAppSelector(
    (state) => state.player.chapters[state.player.currentChapterIdx ?? -1]
  );
  const { seek, isReady } = useGlobalAudioPlayer();
  const position = useAudioTime();
  const theme = useTheme();

  const { videoPosition, videoIsReady } = useAppSelector((state) => state.playerVideoControl);
  const [dragPosition, setDragPosition] = React.useState<number | null>(null);

  const _position = isVideo(playingTrack)
    ? currentChapter != null
      ? videoPosition - currentChapter.time
      : videoPosition
    : position;
  const _duration = currentChapter != null ? currentChapterDuration : (playingTrack?.duration ?? 0);
  const _isReady = isVideo(playingTrack) ? videoIsReady : isReady;
  const sliderPosition = dragPosition ?? Math.min(Math.max(_position, 0), _duration);
  const _remain = _duration - sliderPosition;

  const commitSeek = React.useCallback(
    (value: number) => {
      const newPos = (currentChapter?.time ?? 0) + value;
      playingTrack?.type === "video" ? dispatch(videoOnSeek({ position: newPos })) : seek(newPos);
    },
    [currentChapter?.time, dispatch, playingTrack?.type, seek]
  );

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Grid
        container
        alignItems="center"
        justifyContent="center"
        spacing={0}
        sx={{
          display: { xs: showMobilePlayer ? "flex" : "none", sm: "flex" },
          order: { xs: showMobilePlayer ? 0 : 1, sm: 1 },
          mt: "-2px",
          px: { sm: 0.75 }
        }}
      >
        <Grid
          item
          xs={showMobilePlayer ? 6 : "auto"}
          sm={"auto"}
          sx={{
            pr: { sm: 1 },
            order: {
              xs: showMobilePlayer ? 1 : 0,
              sm: 0
            }
          }}
        >
          <TinyText>{formatDuration(sliderPosition)}</TinyText>
        </Grid>
        <Grid
          item
          xs={showMobilePlayer ? 12 : true}
          sm
          order={showMobilePlayer ? 0 : 1}
          display={"flex"}
          alignItems={"center"}
          sx={{
            minWidth: 0,
            order: {
              xs: showMobilePlayer ? 0 : 1,
              sm: 1
            }
          }}
        >
          <Slider
            size="small"
            value={Math.floor(sliderPosition)}
            min={0}
            step={1}
            disabled={!_isReady}
            max={Math.max(Math.floor(_duration), 1)}
            onChange={(e, value) => {
              e.stopPropagation();
              setDragPosition(value as number);
            }}
            onChangeCommitted={(e, value) => {
              e.stopPropagation();
              setDragPosition(null);
              commitSeek(value as number);
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
          item
          xs={showMobilePlayer ? 6 : "auto"}
          sm={"auto"}
          order={2}
          sx={{
            pl: { sm: 1 }
          }}
        >
          <TinyText align="right">-{formatDuration(Math.max(_remain, 0))}</TinyText>
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
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.5px",
  lineHeight: "18px",
  color: "#ffffff99",
  textTransform: "uppercase"
});
