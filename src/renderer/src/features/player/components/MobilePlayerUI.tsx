import FullscreenIcon from "@mui/icons-material/Fullscreen";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import OndemandVideoOutlinedIcon from "@mui/icons-material/OndemandVideoOutlined";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Paper,
  Popper,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import React from "react";
import { apiAssetUrl } from "@lib/axios";
import { router } from "@app/router";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { hideView } from "../store/playerGuiSlice";
import { reset } from "../store/playerSlice";
import { QueuePanel } from "./FloatingQueueList";
import { isVideo } from "@features/library";
import { useLyrics } from "@features/lyrics";
import { artistImageUrl, artistPath, getPrimaryArtist } from "@utils/artist";
import { useArtist } from "@features/artist/hooks/useArtist";
import { FavoriteButton } from "./FavoriteButton";
import { useAlbumBackgroundColor } from "../utils/albumBackground";
import { LyricsExperience } from "@features/lyrics";
import { toggleView } from "../store/playerGuiSlice";

interface MobilePlayerProps {
  desktopChromeVisible?: boolean;
}

export const MobilePlayer: React.FC<MobilePlayerProps> = ({ desktopChromeVisible = true }) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("sm"));
  const playingTrack = useAppSelector((state) => state.player.playingTrack);
  const queueOpen = useAppSelector((state) => state.playerGui.playingQueue);
  const showMobilePlayer = useAppSelector((state) => state.playerGui.mobilePlayer);
  const lyricsOpen = useAppSelector((state) => state.playerGui.lyrics);
  const backgroundColor = useAlbumBackgroundColor(playingTrack?.album?._id);
  const desktopVideo = isVideo(playingTrack);
  const mediaType = isVideo(playingTrack) ? "video" : "audio";
  const { data: lyricsData } = useLyrics(mediaType, playingTrack?._id, Boolean(playingTrack));
  const noLyrics = lyricsData === null || Boolean(lyricsData && lyricsData.rows.length === 0);

  return (
    <Box
      onMouseMove={() => undefined}
      sx={{
        position: "relative",
        width: "100dvw",
        height: "100dvh",
        bgcolor: desktopVideo ? "transparent" : backgroundColor,
        color: "#fff",
        overflow: "hidden",
        userSelect: "none"
      }}
    >
      <PlayerHeader
        desktopChromeVisible={desktopChromeVisible}
        video={desktopVideo}
        noLyrics={noLyrics}
      />

      {desktopVideo ? (
        <>
          <DesktopVideo />
          {lyricsOpen && <LyricsExperience videoOverlay />}
        </>
      ) : lyricsOpen ? (
        <AudioLyricsContent queueOpen={queueOpen} />
      ) : (
        <AudioPlayerContent queueOpen={queueOpen} />
      )}

      <Box sx={{ display: { xs: "block", sm: "none" } }}>
        <MobileTrackDetails />
      </Box>

      {showMobilePlayer && queueOpen && (
        <>
          {!desktop && (
            <Box
              sx={{
                position: "absolute",
                zIndex: 20,
                inset: "0 0 180px",
                bgcolor: backgroundColor,
                overflow: "hidden"
              }}
            >
              <QueuePanel mobile />
            </Box>
          )}
          {desktop && (
            <Paper
              sx={{
                position: "absolute",
                zIndex: 8,
                top: 98,
                right: 10,
                bottom: 118,
                width: 416,
                overflow: "hidden",
                borderRadius: "22px",
                border: "1px solid rgba(255,255,255,.08)",
                bgcolor: "rgba(27,24,19,.72)",
                backgroundImage: "none"
              }}
            >
              <QueuePanel
                onClose={() => dispatch(hideView("playingQueue"))}
                onClear={() => dispatch(reset({ songs: [], type: "audio" }))}
              />
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

function PlayerHeader({
  desktopChromeVisible,
  video,
  noLyrics
}: {
  desktopChromeVisible: boolean;
  video: boolean;
  noLyrics: boolean;
}) {
  const dispatch = useAppDispatch();
  const lyricsOpen = useAppSelector((state) => state.playerGui.lyrics);
  const [fullscreen, setFullscreen] = React.useState(Boolean(document.fullscreenElement));

  React.useEffect(() => {
    const updateFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => document.removeEventListener("fullscreenchange", updateFullscreen);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.error("Unable to toggle fullscreen", error);
    }
  };

  return (
    <Box
      component="header"
      sx={{
        position: "absolute",
        zIndex: 12,
        top: 0,
        left: 0,
        right: 0,
        height: 88,
        px: { xs: 2.5, sm: 2.75 },
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        opacity: { xs: 1, sm: video && !desktopChromeVisible ? 0 : 1 },
        transform: {
          xs: "none",
          sm: video && !desktopChromeVisible ? "translateY(-16px)" : "none"
        },
        transition: "opacity 220ms ease, transform 220ms ease",
        pointerEvents: { sm: video && !desktopChromeVisible ? "none" : "auto" }
      }}
    >
      <ArtistIdentity />
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.25, sm: 1 } }}>
        <Button
          aria-label="Lyrics"
          aria-pressed={lyricsOpen}
          disabled={noLyrics}
          onClick={() => dispatch(toggleView("lyrics"))}
          sx={{
            display: { xs: "inline-flex", sm: "none" },
            opacity: noLyrics ? 0.34 : 1,
            mr: 0.5,
            borderRadius: "999px",
            bgcolor: lyricsOpen ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.12)",
            color: lyricsOpen ? "#171717" : "#fff",
            textTransform: "none",
            fontWeight: 800
          }}
        >
          Lyrics
        </Button>
        <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1 }}>
          <HeaderPill>{video ? "Similar videos" : "Similar tracks"}</HeaderPill>
          <HeaderPill>Credits</HeaderPill>
          <HeaderPill
            active={lyricsOpen}
            disabled={noLyrics}
            onClick={() => dispatch(toggleView("lyrics"))}
          >
            Lyrics
          </HeaderPill>
        </Box>
        {video && (
          <IconButton aria-label="Video display mode">
            <OndemandVideoOutlinedIcon />
          </IconButton>
        )}
        <IconButton
          aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          sx={{ display: { xs: "none", sm: "inline-flex" } }}
          onClick={() => void toggleFullscreen()}
        >
          <FullscreenIcon />
        </IconButton>
        <IconButton aria-label="Minimize player" onClick={() => dispatch(hideView("mobilePlayer"))}>
          <KeyboardArrowDownIcon sx={{ fontSize: 28 }} />
        </IconButton>
      </Box>
    </Box>
  );
}

function ArtistIdentity() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("sm"));
  const playingTrack = useAppSelector((state) => state.player.playingTrack);
  const artist = getPrimaryArtist(playingTrack?.artist);
  const { data } = useArtist(artist);
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const [following, setFollowing] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout>>();

  const open = (target: HTMLElement) => {
    if (!desktop) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setAnchor(target);
  };
  const scheduleClose = () => {
    if (!desktop) return;
    closeTimer.current = setTimeout(() => setAnchor(null), 120);
  };
  const openArtist = () => {
    setAnchor(null);
    dispatch(hideView("mobilePlayer"));
    router.navigate(artistPath(artist));
  };

  return (
    <>
      <Box
        onMouseEnter={(event) => open(event.currentTarget)}
        onMouseLeave={scheduleClose}
        onClick={openArtist}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          p: { xs: 0, sm: "6px 16px 6px 6px" },
          borderRadius: "999px",
          bgcolor: { xs: "transparent", sm: "rgba(255,255,255,.1)" },
          cursor: "pointer",
          "&:hover .artist-avatar": {
            transform: "scale(1.12)"
          }
        }}
      >
        <Avatar
          className="artist-avatar"
          aria-label={artist}
          src={artistImageUrl(artist)}
          onError={(event: React.SyntheticEvent<HTMLImageElement>) => {
            const fallback = apiAssetUrl(`/album/${playingTrack?.album?._id}/cover`);
            if (event.currentTarget.src !== fallback) {
              event.currentTarget.src = fallback;
            }
          }}
          sx={{
            width: 46,
            height: 46,
            border: "1px solid rgba(255,255,255,.22)",
            transition: "transform 160ms cubic-bezier(.22, 1, .36, 1)"
          }}
        >
          {artist.slice(0, 1)}
        </Avatar>
        <Typography sx={{ display: { xs: "none", sm: "block" }, fontWeight: 800 }}>
          {artist}
        </Typography>
      </Box>
      {desktop && (
        <Popper
          open={Boolean(anchor)}
          anchorEl={anchor}
          placement="bottom-start"
          sx={{ zIndex: 1600 }}
        >
          <Paper
            onMouseEnter={() => anchor && open(anchor)}
            onMouseLeave={scheduleClose}
            sx={{
              mt: 1,
              width: 420,
              maxWidth: "calc(100dvw - 32px)",
              p: 3,
              borderRadius: "20px",
              bgcolor: "#151515",
              backgroundImage: "none",
              boxShadow: "0 24px 70px rgba(0,0,0,.5)"
            }}
          >
            <Typography sx={{ fontSize: 20, fontWeight: 850 }}>{artist}</Typography>
            <Typography sx={{ mt: 0.75, color: "text.secondary", lineHeight: 1.55 }}>
              Explore {artist} through {data?.songs.length ?? 0} tracks and{" "}
              {data?.albums.length ?? 0} releases saved in your library.
            </Typography>
            <Box sx={{ display: "flex", gap: 1.25, mt: 2.25 }}>
              <Button
                variant="contained"
                onClick={(event) => {
                  event.stopPropagation();
                  setFollowing((value) => !value);
                }}
                sx={{ borderRadius: "999px", bgcolor: "#2b2b2b", color: "#fff" }}
              >
                {following ? "Following" : "Follow"}
              </Button>
              <Button
                onClick={openArtist}
                sx={{ borderRadius: "999px", bgcolor: "#2b2b2b", color: "#fff" }}
              >
                Read more
              </Button>
            </Box>
          </Paper>
        </Popper>
      )}
    </>
  );
}

function AudioPlayerContent({ queueOpen }: { queueOpen: boolean }) {
  const playingTrack = useAppSelector((state) => state.player.playingTrack);

  return (
    <Box
      data-testid="expanded-mobile-artwork-stage"
      sx={{
        position: "absolute",
        top: { xs: 96, sm: 92 },
        bottom: { xs: 330, sm: 120 },
        left: 0,
        right: { xs: 0, sm: queueOpen ? "436px" : 0 },
        display: "grid",
        placeItems: "center",
        transition: "right 280ms ease"
      }}
    >
      <InteractiveAlbumArtwork
        src={apiAssetUrl(`/album/${playingTrack?.album?._id}/cover`)}
        queueOpen={queueOpen}
      />
    </Box>
  );
}

function AudioLyricsContent({ queueOpen }: { queueOpen: boolean }) {
  const playingTrack = useAppSelector((state) => state.player.playingTrack);
  return (
    <Box
      data-testid="expanded-lyrics-stage"
      sx={{
        position: "absolute",
        top: { xs: 0, sm: 88 },
        bottom: { xs: 330, sm: 120 },
        left: 0,
        right: { xs: 0, sm: queueOpen ? "436px" : 0 },
        display: { xs: "block", lg: "grid" },
        gridTemplateColumns: { lg: "46% 54%" },
        transition: "right 280ms ease"
      }}
    >
      <Box
        data-testid="lyrics-artwork"
        sx={{
          display: { xs: "none", lg: "grid" },
          placeItems: "center",
          minWidth: 0,
          p: 5
        }}
      >
        <InteractiveAlbumArtwork
          src={apiAssetUrl(`/album/${playingTrack?.album?._id}/cover`)}
          queueOpen={queueOpen}
        />
      </Box>
      <LyricsExperience />
    </Box>
  );
}

function MobileTrackDetails() {
  const playingTrack = useAppSelector((state) => state.player.playingTrack);
  const currentChapter = useAppSelector(
    (state) => state.player.chapters[state.player.currentChapterIdx ?? -1]
  );

  return (
    <Box
      data-testid="expanded-mobile-track-details"
      sx={{
        position: "absolute",
        left: 20,
        right: 20,
        bottom: "clamp(238px, 33.5dvh, 270px)",
        display: "flex",
        alignItems: "center",
        gap: 2
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap sx={{ fontSize: 20, fontWeight: 800, lineHeight: 1.25 }}>
          {currentChapter
            ? [currentChapter.title, currentChapter.subTitle].filter(Boolean).join(" - ")
            : playingTrack?.title}
        </Typography>
        <Typography
          noWrap
          color="text.secondary"
          sx={{ mt: 0.25, fontSize: 16, lineHeight: 1.35, cursor: "pointer" }}
          onClick={() => router.navigate(artistPath(getPrimaryArtist(playingTrack?.artist)))}
        >
          {playingTrack?.artist.join(", ")}
        </Typography>
      </Box>
      <FavoriteButton size={38} />
    </Box>
  );
}

function DesktopVideo() {
  const playingTrack = useAppSelector((state) => state.player.playingTrack);
  if (!isVideo(playingTrack)) return null;
  return <Box aria-label="Video playback surface" sx={{ position: "absolute", inset: 0 }} />;
}

function InteractiveAlbumArtwork({ src, queueOpen }: { src: string; queueOpen: boolean }) {
  const [pointer, setPointer] = React.useState({ x: 50, y: 50, active: false });
  const rotateX = pointer.active ? (50 - pointer.y) * 0.09 : 0;
  const rotateY = pointer.active ? (pointer.x - 50) * 0.09 : 0;
  const reflectionX = 100 - pointer.x;
  const reflectionY = 100 - pointer.y;

  return (
    <Box
      onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        setPointer({
          x: ((event.clientX - bounds.left) / bounds.width) * 100,
          y: ((event.clientY - bounds.top) / bounds.height) * 100,
          active: true
        });
      }}
      onMouseLeave={() => setPointer({ x: 50, y: 50, active: false })}
      sx={{
        position: "relative",
        width: {
          xs: "min(calc(100vw - 128px), calc(100dvh - 440px), 42vh)",
          sm: queueOpen ? "min(58vh, calc(100vw - 520px))" : "min(66vh, 58vw)"
        },
        height: {
          xs: "min(calc(100vw - 128px), calc(100dvh - 440px), 42vh)",
          sm: queueOpen ? "min(58vh, calc(100vw - 520px))" : "min(66vh, 58vw)"
        },
        transform: {
          xs: "none",
          sm: `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${
            pointer.active ? 1.015 : 1
          })`
        },
        transformStyle: "preserve-3d",
        transition: pointer.active
          ? "width 280ms ease, height 280ms ease, transform 70ms linear"
          : "width 280ms ease, height 280ms ease, transform 240ms cubic-bezier(.22, 1, .36, 1)",
        boxShadow: pointer.active
          ? `${(pointer.x - 50) * -0.22}px ${(pointer.y - 50) * -0.22}px 52px rgba(0,0,0,.38)`
          : "0 20px 44px rgba(0,0,0,.22)"
      }}
    >
      <Avatar
        aria-label="Album artwork"
        variant="square"
        src={src}
        sx={{ width: "100%", height: "100%", borderRadius: 0 }}
      >
        <MusicNoteIcon />
      </Avatar>
      <Box
        sx={{
          display: { xs: "none", sm: "block" },
          position: "absolute",
          zIndex: 2,
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `
            radial-gradient(circle at ${reflectionX}% ${reflectionY}%, rgba(255,255,255,.15) 0%, rgba(255,255,255,.12) 10%, rgba(255,255,255,.08) 20%, rgba(255,255,255,.04) 35%, rgba(255,255,255,.02) 50%, rgba(255,255,255,.004) 65%, transparent 80%),
            repeating-linear-gradient(8deg, rgba(255,255,255,.012) 0 1px, transparent 1px 4px)
          `,
          mixBlendMode: "screen",
          opacity: pointer.active ? 1 : 0,
          transition: "opacity 160ms ease"
        }}
      />
    </Box>
  );
}

function HeaderPill({
  children,
  active,
  disabled,
  onClick
}: React.PropsWithChildren<{ active?: boolean; disabled?: boolean; onClick?: () => void }>) {
  return (
    <Box
      component={onClick && !disabled ? "button" : "div"}
      type={onClick && !disabled ? "button" : undefined}
      onClick={disabled ? undefined : onClick}
      sx={{
        border: 0,
        color: "inherit",
        cursor: disabled ? "default" : onClick ? "pointer" : "default",
        px: 2.5,
        height: 48,
        display: "flex",
        alignItems: "center",
        borderRadius: "999px",
        bgcolor: active ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.1)",
        ...(active ? { color: "#171717" } : {}),
        fontWeight: 800,
        opacity: disabled ? 0.34 : 1
      }}
    >
      {children}
    </Box>
  );
}
