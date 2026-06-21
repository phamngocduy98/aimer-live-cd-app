import SyncIcon from "@mui/icons-material/Sync";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import React from "react";
import { useGlobalAudioPlayer } from "react-use-audio-player";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { hideView } from "@features/player/store/playerGuiSlice";
import { videoOnSeek } from "@features/player/store/playerVideoControl";
import { isVideo } from "@features/library";
import { useLyrics } from "../hooks/useLyrics";
import { findActiveCueIndex } from "../lyricsTiming";
import { lyricPairs } from "../types";

export function LyricsExperience({ videoOverlay = false }: { videoOverlay?: boolean }) {
  const dispatch = useAppDispatch();
  const playingTrack = useAppSelector((state) => state.player.playingTrack);
  const pairId = useAppSelector((state) => state.playerGui.lyricPair);
  const videoPosition = useAppSelector((state) => state.playerVideoControl.videoPosition);
  const { getPosition, seek } = useGlobalAudioPlayer();
  const audioPosition = useAudioPosition(getPosition, !isVideo(playingTrack));
  const mediaType = isVideo(playingTrack) ? "video" : "audio";
  const { data, isLoading } = useLyrics(mediaType, playingTrack?._id, Boolean(playingTrack));
  const pair = lyricPairs.find((item) => item.id === pairId) ?? lyricPairs[0];
  const primary = (data?.rows ?? []).filter((row) => Boolean(row[pair.primary]));
  const mediaPositionMs = (isVideo(playingTrack) ? videoPosition : audioPosition) * 1000;
  const [optimisticPositionMs, setOptimisticPositionMs] = React.useState<number | null>(null);
  const positionMs = optimisticPositionMs ?? mediaPositionMs;
  const activeIndex = findActiveCueIndex(primary, positionMs);
  const activeRow = activeIndex >= 0 ? primary[activeIndex] : undefined;
  const activePrimary = activeRow?.[pair.primary];
  const activeSecondary = activeRow?.[pair.secondary];
  const [syncEnabled, setSyncEnabled] = React.useState(true);
  const activeRef = React.useRef<HTMLDivElement | null>(null);
  const seekToRow = React.useCallback(
    (startMs: number) => {
      const position = startMs / 1000;
      if (isVideo(playingTrack)) {
        dispatch(videoOnSeek({ position }));
      } else {
        seek(position);
      }
      setOptimisticPositionMs(startMs);
      setSyncEnabled(true);
    },
    [dispatch, playingTrack, seek]
  );

  React.useEffect(() => {
    if (optimisticPositionMs == null) return;
    const timeout = window.setTimeout(() => setOptimisticPositionMs(null), 800);
    return () => window.clearTimeout(timeout);
  }, [optimisticPositionMs]);

  React.useEffect(() => {
    if (syncEnabled && activeIndex >= 0) {
      activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIndex, syncEnabled]);

  React.useEffect(() => {
    setSyncEnabled(true);
    setOptimisticPositionMs(null);
  }, [playingTrack?._id]);

  React.useEffect(() => {
    if (!isLoading && primary.length === 0) {
      dispatch(hideView("lyrics"));
    }
  }, [isLoading, primary.length, dispatch]);

  if (videoOverlay) {
    return (
      <>
        {(activePrimary || activeSecondary) && (
          <Box
            data-testid="video-lyrics-overlay"
            sx={{
              position: "absolute",
              zIndex: 11,
              left: "50%",
              bottom: { xs: 305, sm: 118 },
              transform: "translateX(-50%)",
              width: "min(900px, calc(100vw - 48px))",
              px: 2,
              py: 1.25,
              textAlign: "center",
              textShadow: "0 2px 8px #000, 0 0 3px #000"
            }}
          >
            <Typography sx={{ fontSize: { xs: 22, sm: 30 }, fontWeight: 700, lineHeight: 1.25 }}>
              {activePrimary}
            </Typography>
            {activeSecondary && activeSecondary !== activePrimary && (
              <Typography sx={{ mt: 0.5, fontSize: { xs: 15, sm: 19 }, fontWeight: 600 }}>
                {activeSecondary}
              </Typography>
            )}
          </Box>
        )}
      </>
    );
  }

  return (
    <Box
      data-testid="lyrics-experience"
      sx={{
        position: "relative",
        height: "100%",
        minWidth: 0,
        overflow: "hidden"
      }}
    >
      {!syncEnabled && (
        <Button
          variant="contained"
          startIcon={<SyncIcon />}
          aria-pressed="false"
          onClick={() => {
            setSyncEnabled(true);
            activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
          sx={{
            ...syncButtonSx,
            position: "absolute",
            zIndex: 3,
            bottom: { xs: 14, sm: 28 },
            right: { xs: 14, sm: 40 },
            display: "inline-flex"
          }}
        >
          Sync Lyrics
        </Button>
      )}

      <Box
        role="feed"
        aria-label="Synchronized lyrics"
        onWheel={() => setSyncEnabled(false)}
        onTouchMove={() => setSyncEnabled(false)}
        sx={{
          height: "100%",
          overflowY: "auto",
          width: "calc(100% - 16px)",
          mr: 2,
          px: { xs: 2.5, sm: 4, lg: 3 },
          py: { xs: 10, sm: 11 },
          maskImage: "linear-gradient(#fff0 0%, #fff 10% 95%, #fff0 100%)",
          WebkitMaskImage: "linear-gradient(#fff0 0%, #fff 10% 95%, #fff0 100%)"
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: { sm: 820, lg: 720, xl: 780 },
            mx: "auto",
            pb: { xs: 8, sm: 10 }
          }}
        >
          {isLoading && <CircularProgress />}
          {!isLoading && primary.length === 0 && (
            <Typography sx={{ mt: 8, fontSize: 24, fontWeight: 700, color: "text.secondary" }}>
              No lyrics available for {pair.label}.
            </Typography>
          )}
          {primary.map((cue, index) => {
            const active = index === activeIndex;
            const translated = cue[pair.secondary];
            return (
              <Box
                component="button"
                type="button"
                key={`${cue.startMs}-${index}`}
                ref={active ? activeRef : undefined}
                aria-label={`Seek to lyric: ${cue[pair.primary]}`}
                aria-current={active ? "true" : undefined}
                onClick={() => seekToRow(cue.startMs)}
                sx={{
                  display: "block",
                  width: "100%",
                  mb: { xs: 3.5, sm: 4.5 },
                  p: 0,
                  border: 0,
                  color: "inherit",
                  bgcolor: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  opacity: active ? 1 : 0.34,
                  transform: active ? "scale(1)" : "scale(.985)",
                  transformOrigin: "left center",
                  transition: "opacity 180ms ease, transform 180ms ease",
                  "&:hover": {
                    opacity: active ? 1 : 0.62
                  },
                  "&:focus-visible": {
                    opacity: 1,
                    outline: "2px solid rgba(255,255,255,.8)",
                    outlineOffset: 6,
                    borderRadius: 1
                  }
                }}
              >
                <Typography
                  sx={{
                    whiteSpace: "pre-line",
                    fontSize: { xs: 30, sm: 36, lg: 32, xl: 38 },
                    fontWeight: 700,
                    lineHeight: 1.2
                  }}
                >
                  {cue[pair.primary]}
                </Typography>
                {translated && translated !== cue[pair.primary] && (
                  <Typography
                    sx={{
                      mt: 0.75,
                      whiteSpace: "pre-line",
                      fontSize: { xs: 17, sm: 20, lg: 18, xl: 21 },
                      fontWeight: 600,
                      lineHeight: 1.35,
                      color: active ? "rgba(255,255,255,.82)" : "inherit"
                    }}
                  >
                    {translated}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

const lyricControlBaseSx = {
  height: 40,
  borderRadius: "999px",
  fontFamily: `"Square Sans Text VF", "Square Sans Text", Helvetica, Arial, sans-serif`,
  bgcolor: "rgba(255,255,255,.94)",
  color: "#171717",
  textTransform: "none",
  fontWeight: 600,
  fontSize: 14,
  boxShadow: "0 2px 10px rgba(0,0,0,.12)",
  backdropFilter: "blur(14px)",
  "&:hover": { bgcolor: "#fff" }
} as const;

const syncButtonSx = {
  ...lyricControlBaseSx,
  px: 2.25,
  "& .MuiButton-startIcon": {
    mr: 1
  },
  "& .MuiSvgIcon-root": { fontSize: 14 }
} as const;

function useAudioPosition(getPosition: () => number, enabled: boolean) {
  const [position, setPosition] = React.useState(0);
  React.useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const update = () => {
      setPosition(getPosition());
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [enabled, getPosition]);
  return position;
}
