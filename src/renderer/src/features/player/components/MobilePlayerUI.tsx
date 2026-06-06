import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
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
import ReactPlayer from "react-player";
import { apiAssetUrl } from "@lib/axios";
import { router } from "@app/router";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { hideView, toggleView } from "../store/playerGuiSlice";
import { nextTrack } from "../store/playerSlice";
import { reset } from "../store/playerSlice";
import {
  videoOnBuffer,
  videoOnBufferEnd,
  videoOnError,
  videoOnReady,
  videoOnSeek
} from "../store/playerVideoControl";
import { onVideoPostion } from "../thunks/onVideoPosition";
import { QueuePanel } from "./FloatingQueueList";
import { isVideo } from "@features/library";
import { artistPath, getPrimaryArtist } from "@utils/artist";
import { useArtist } from "@features/artist/hooks/useArtist";

interface MobilePlayerProps {
  desktopChromeVisible?: boolean;
}

export const MobilePlayer: React.FC<MobilePlayerProps> = ({ desktopChromeVisible = true }) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  const playingTrack = useAppSelector((state) => state.player.playingTrack);
  const queueOpen = useAppSelector((state) => state.playerGui.playingQueue);
  const [dominantColor, setDominantColor] = React.useState<{
    r: number;
    g: number;
    b: number;
  } | null>(null);

  React.useEffect(() => {
    const albumId = playingTrack?.album?._id;
    if (!albumId) {
      setDominantColor(null);
      return;
    }
    getDominantColor(apiAssetUrl(`/album/${albumId}/cover`)).then(setDominantColor);
  }, [playingTrack?.album?._id]);

  const gradient = dominantColor
    ? `linear-gradient(180deg, rgba(${dominantColor.r},${dominantColor.g},${dominantColor.b},.52), rgba(${dominantColor.r},${dominantColor.g},${dominantColor.b},.2))`
    : "linear-gradient(180deg, #756b50, #514832)";
  const desktopVideo = isVideo(playingTrack);

  return (
    <Box
      onMouseMove={() => undefined}
      sx={{
        position: "relative",
        width: "100dvw",
        height: "100dvh",
        bgcolor: "#000",
        backgroundImage: { xs: gradient, md: desktopVideo ? "none" : gradient },
        color: "#fff",
        overflow: "hidden",
        userSelect: "none"
      }}
    >
      <PlayerHeader desktopChromeVisible={desktopChromeVisible} video={desktopVideo} />

      {desktopVideo ? <DesktopVideo /> : <AudioPlayerContent queueOpen={queueOpen} />}

      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <MobileTrackDetails />
      </Box>

      {queueOpen && (
        <>
          {!desktop && (
            <Box
              sx={{
                position: "absolute",
                zIndex: 20,
                inset: "0 0 180px",
                bgcolor: "rgba(30,34,26,.94)",
                backdropFilter: "blur(22px)",
                overflow: "hidden"
              }}
            >
              <QueuePanel mobile />
            </Box>
          )}
          {desktop && !desktopVideo && (
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
  video
}: {
  desktopChromeVisible: boolean;
  video: boolean;
}) {
  const dispatch = useAppDispatch();

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
        px: { xs: 2.5, md: 2.75 },
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        opacity: { xs: 1, md: video && !desktopChromeVisible ? 0 : 1 },
        transform: {
          xs: "none",
          md: video && !desktopChromeVisible ? "translateY(-16px)" : "none"
        },
        transition: "opacity 220ms ease, transform 220ms ease",
        pointerEvents: { md: video && !desktopChromeVisible ? "none" : "auto" }
      }}
    >
      <ArtistIdentity />
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.25, md: 1 } }}>
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
          <HeaderPill>{video ? "Similar videos" : "Similar tracks"}</HeaderPill>
          <HeaderPill>Credits</HeaderPill>
          {!video && <HeaderPill>Lyrics</HeaderPill>}
        </Box>
        {video && (
          <IconButton aria-label="Video display mode">
            <OndemandVideoOutlinedIcon />
          </IconButton>
        )}
        <IconButton aria-label="Fullscreen" sx={{ display: { xs: "none", md: "inline-flex" } }}>
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
  const playingTrack = useAppSelector((state) => state.player.playingTrack);
  const artist = getPrimaryArtist(playingTrack?.artist);
  const { data } = useArtist(artist);
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const [following, setFollowing] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout>>();

  const open = (target: HTMLElement) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setAnchor(target);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setAnchor(null), 120);
  };

  return (
    <>
      <Box
        onMouseEnter={(event) => open(event.currentTarget)}
        onMouseLeave={scheduleClose}
        onClick={() => router.navigate(artistPath(artist))}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          p: { xs: 0, md: "6px 16px 6px 6px" },
          borderRadius: "999px",
          bgcolor: { xs: "transparent", md: "rgba(255,255,255,.1)" },
          cursor: "pointer"
        }}
      >
        <Avatar
          aria-label={artist}
          src={apiAssetUrl(`/album/${playingTrack?.album?._id}/cover`)}
          sx={{ width: 46, height: 46, border: "1px solid rgba(255,255,255,.22)" }}
        >
          {artist.slice(0, 1)}
        </Avatar>
        <Typography sx={{ display: { xs: "none", md: "block" }, fontWeight: 800 }}>
          {artist}
        </Typography>
      </Box>
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
            Explore {artist} through {data?.songs.length ?? 0} tracks and {data?.albums.length ?? 0}{" "}
            releases saved in your library.
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
              onClick={() => router.navigate(artistPath(artist))}
              sx={{ borderRadius: "999px", bgcolor: "#2b2b2b", color: "#fff" }}
            >
              Read more
            </Button>
          </Box>
        </Paper>
      </Popper>
    </>
  );
}

function AudioPlayerContent({ queueOpen }: { queueOpen: boolean }) {
  const playingTrack = useAppSelector((state) => state.player.playingTrack);

  return (
    <Box
      sx={{
        position: "absolute",
        top: { xs: 100, md: 92 },
        bottom: { xs: 310, md: 120 },
        left: 0,
        right: { xs: 0, md: queueOpen ? "436px" : 0 },
        display: "grid",
        placeItems: "center",
        transition: "right 280ms ease"
      }}
    >
      <Avatar
        aria-label="Album artwork"
        variant="square"
        src={apiAssetUrl(`/album/${playingTrack?.album?._id}/cover`)}
        sx={{
          width: {
            xs: "min(calc(100vw - 80px), 46vh)",
            md: queueOpen ? "min(58vh, calc(100vw - 520px))" : "min(66vh, 58vw)"
          },
          height: {
            xs: "min(calc(100vw - 80px), 46vh)",
            md: queueOpen ? "min(58vh, calc(100vw - 520px))" : "min(66vh, 58vw)"
          },
          borderRadius: 0,
          boxShadow: "0 20px 44px rgba(0,0,0,.22)",
          transition: "width 280ms ease, height 280ms ease"
        }}
      >
        <MusicNoteIcon />
      </Avatar>
    </Box>
  );
}

function MobileTrackDetails() {
  const dispatch = useAppDispatch();
  const playingTrack = useAppSelector((state) => state.player.playingTrack);
  const currentChapter = useAppSelector(
    (state) => state.player.chapters[state.player.currentChapterIdx ?? -1]
  );

  return (
    <Box
      sx={{
        position: "absolute",
        left: 20,
        right: 20,
        bottom: 220,
        display: "flex",
        alignItems: "center"
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap sx={{ fontSize: 18, fontWeight: 800 }}>
          {currentChapter
            ? [currentChapter.title, currentChapter.subTitle].filter(Boolean).join(" - ")
            : playingTrack?.title}
        </Typography>
        <Typography
          noWrap
          color="text.secondary"
          sx={{ mt: 0.5, cursor: "pointer" }}
          onClick={() => router.navigate(artistPath(getPrimaryArtist(playingTrack?.artist)))}
        >
          {playingTrack?.artist.join(", ")}
        </Typography>
      </Box>
      <IconButton aria-label="Favorite">
        <FavoriteBorderIcon sx={{ fontSize: 34 }} />
      </IconButton>
      <IconButton aria-label="More actions" onClick={() => dispatch(toggleView("playingQueue"))}>
        <MoreHorizIcon />
      </IconButton>
    </Box>
  );
}

function DesktopVideo() {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  const videoRef = React.useRef<ReactPlayer | null>(null);
  const dispatch = useAppDispatch();
  const showMobilePlayer = useAppSelector((state) => state.playerGui.mobilePlayer);
  const playingTrack = useAppSelector((state) => state.player.playingTrack);
  const { videoVolume, videoUrl, videoPlaying, videoLoop, videoSeekPosition, videoPosition } =
    useAppSelector((state) => state.playerVideoControl);

  React.useEffect(() => {
    if (showMobilePlayer) videoRef.current?.seekTo(videoPosition);
  }, [showMobilePlayer]);

  React.useEffect(() => {
    if (videoSeekPosition != null) {
      videoRef.current?.seekTo(videoSeekPosition, "seconds");
      dispatch(videoOnSeek({ position: null }));
    }
  }, [videoSeekPosition]);

  if (!videoUrl || !isVideo(playingTrack)) return null;

  return desktop ? (
    <Box sx={{ position: "absolute", inset: 0 }}>
      <ReactPlayer
        ref={videoRef}
        width="100%"
        height="100%"
        playing={videoPlaying && showMobilePlayer}
        url={videoUrl}
        loop={videoLoop}
        volume={videoVolume}
        style={{ background: "#000" }}
        config={{ youtube: { playerVars: { controls: 0 } } }}
        onReady={() => dispatch(videoOnReady())}
        onError={(error) => dispatch(videoOnError({ error: `${error}` }))}
        onBuffer={() => dispatch(videoOnBuffer())}
        onBufferEnd={() => dispatch(videoOnBufferEnd())}
        onProgress={(state) => dispatch(onVideoPostion(state.playedSeconds))}
        onEnded={() => dispatch(nextTrack())}
      />
    </Box>
  ) : (
    <Box
      sx={{
        display: "grid",
        position: "absolute",
        top: 86,
        left: 20,
        right: 20,
        bottom: 310,
        placeItems: "center"
      }}
    >
      <ReactPlayer
        ref={videoRef}
        width="100%"
        height="100%"
        playing={videoPlaying && showMobilePlayer}
        url={videoUrl}
        loop={videoLoop}
        volume={videoVolume}
        style={{ maxHeight: "100%", background: "#000" }}
        onReady={() => dispatch(videoOnReady())}
        onError={(error) => dispatch(videoOnError({ error: `${error}` }))}
        onBuffer={() => dispatch(videoOnBuffer())}
        onBufferEnd={() => dispatch(videoOnBufferEnd())}
        onProgress={(state) => dispatch(onVideoPostion(state.playedSeconds))}
        onEnded={() => dispatch(nextTrack())}
      />
    </Box>
  );
}

function HeaderPill({ children }: React.PropsWithChildren) {
  return (
    <Box
      sx={{
        px: 2.5,
        height: 48,
        display: "flex",
        alignItems: "center",
        borderRadius: "999px",
        bgcolor: "rgba(255,255,255,.1)",
        fontWeight: 800
      }}
    >
      {children}
    </Box>
  );
}

async function getDominantColor(
  imageUrl: string
): Promise<{ r: number; g: number; b: number } | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageUrl;
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) return resolve(null);
        canvas.width = 1;
        canvas.height = 1;
        context.drawImage(image, 0, 0, 1, 1);
        const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
        resolve({ r, g, b });
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
  });
}
