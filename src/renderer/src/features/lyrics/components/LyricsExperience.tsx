import LanguageIcon from "@mui/icons-material/Language";
import SyncIcon from "@mui/icons-material/Sync";
import { Box, Button, CircularProgress, Menu, MenuItem, Typography } from "@mui/material";
import React from "react";
import { useGlobalAudioPlayer } from "react-use-audio-player";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { hideView, setLyricPair } from "@features/player/store/playerGuiSlice";
import { isVideo } from "@features/library";
import { useLyrics } from "../hooks/useLyrics";
import { findActiveCueIndex } from "../lyricsTiming";
import { lyricPairs } from "../types";

export function LyricsExperience({ videoOverlay = false }: { videoOverlay?: boolean }) {
  const dispatch = useAppDispatch();
  const playingTrack = useAppSelector((state) => state.player.playingTrack);
  const pairId = useAppSelector((state) => state.playerGui.lyricPair);
  const videoPosition = useAppSelector((state) => state.playerVideoControl.videoPosition);
  const { getPosition } = useGlobalAudioPlayer();
  const audioPosition = useAudioPosition(getPosition, !isVideo(playingTrack));
  const mediaType = isVideo(playingTrack) ? "video" : "audio";
  const { data, isLoading } = useLyrics(mediaType, playingTrack?._id, Boolean(playingTrack));
  const pair = lyricPairs.find((item) => item.id === pairId) ?? lyricPairs[0];
  const primary = (data?.rows ?? []).filter((row) => Boolean(row[pair.primary]));
  const positionMs = (isVideo(playingTrack) ? videoPosition : audioPosition) * 1000;
  const activeIndex = findActiveCueIndex(primary, positionMs);
  const activeRow = activeIndex >= 0 ? primary[activeIndex] : undefined;
  const activePrimary = activeRow?.[pair.primary];
  const activeSecondary = activeRow?.[pair.secondary];
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [syncEnabled, setSyncEnabled] = React.useState(true);
  const activeRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (syncEnabled && activeIndex >= 0) {
      activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIndex, syncEnabled]);

  React.useEffect(() => setSyncEnabled(true), [playingTrack?._id]);

  React.useEffect(() => {
    if (!isLoading && primary.length === 0) {
      dispatch(hideView("lyrics"));
    }
  }, [isLoading, primary.length, dispatch]);

  if (videoOverlay) {
    return (
      <>
        <Box
          sx={{
            position: "absolute",
            zIndex: 13,
            right: { xs: 18, sm: 28 },
            bottom: { xs: 390, sm: 156 },
            display: "flex",
            gap: 1
          }}
        >
          <Button
            variant="contained"
            startIcon={<LanguageIcon />}
            aria-label="Lyrics language"
            onClick={(event) => setMenuAnchor(event.currentTarget)}
            sx={floatingButtonSx}
          >
            {pair.label}
          </Button>
          <Button
            variant="contained"
            startIcon={<SyncIcon />}
            aria-pressed="true"
            sx={floatingButtonSx}
          >
            Sync Lyrics
          </Button>
        </Box>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          sx={{ zIndex: 1400 }}
        >
          {lyricPairs.map((item) => (
            <MenuItem
              key={item.id}
              selected={item.id === pair.id}
              onClick={() => {
                dispatch(setLyricPair(item.id));
                setMenuAnchor(null);
              }}
            >
              {item.label}
            </MenuItem>
          ))}
        </Menu>
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
            <Typography sx={{ fontSize: { xs: 22, sm: 30 }, fontWeight: 800, lineHeight: 1.25 }}>
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
      <Box
        sx={{
          position: "absolute",
          zIndex: 3,
          bottom: { xs: 14, sm: 18 },
          right: { xs: 14, sm: 22 },
          display: { xs: "none", sm: "flex" },
          gap: 1
        }}
      >
        <Button
          variant="contained"
          startIcon={<LanguageIcon />}
          aria-label="Lyrics language"
          onClick={(event) => setMenuAnchor(event.currentTarget)}
          sx={floatingButtonSx}
        >
          {pair.label}
        </Button>
        <Button
          variant="contained"
          startIcon={<SyncIcon />}
          aria-pressed={syncEnabled}
          onClick={() => {
            setSyncEnabled((current) => {
              if (!current) {
                activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              }
              return !current;
            });
          }}
          sx={{ ...floatingButtonSx, opacity: syncEnabled ? 1 : 0.72 }}
        >
          Sync Lyrics
        </Button>
      </Box>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        sx={{ zIndex: 1400 }}
      >
        {lyricPairs.map((item) => (
          <MenuItem
            key={item.id}
            selected={item.id === pair.id}
            onClick={() => {
              dispatch(setLyricPair(item.id));
              setMenuAnchor(null);
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>

      <Box
        role="feed"
        aria-label="Synchronized lyrics"
        onWheel={() => setSyncEnabled(false)}
        onTouchMove={() => setSyncEnabled(false)}
        sx={{
          height: "100%",
          overflowY: "auto",
          px: { xs: 3, sm: 8, lg: 5 },
          pt: { xs: 10, sm: 13 },
          pb: { xs: 8, sm: 14 },
          scrollbarWidth: "thin"
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
              key={`${cue.startMs}-${index}`}
              ref={active ? activeRef : undefined}
              aria-current={active ? "true" : undefined}
              sx={{
                mb: { xs: 3.5, sm: 4.5 },
                opacity: active ? 1 : 0.34,
                transform: active ? "scale(1)" : "scale(.985)",
                transformOrigin: "left center",
                transition: "opacity 180ms ease, transform 180ms ease"
              }}
            >
              <Typography
                sx={{
                  whiteSpace: "pre-line",
                  fontSize: { xs: 30, sm: 38, lg: 34, xl: 42 },
                  fontWeight: 850,
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
                    fontSize: { xs: 17, sm: 21, lg: 19, xl: 23 },
                    fontWeight: 650,
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
  );
}

const floatingButtonSx = {
  minHeight: 42,
  borderRadius: "999px",
  bgcolor: "rgba(220,235,255,.88)",
  color: "#31536d",
  textTransform: "none",
  fontWeight: 800,
  backdropFilter: "blur(16px)",
  "&:hover": { bgcolor: "rgba(235,244,255,.96)" }
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
