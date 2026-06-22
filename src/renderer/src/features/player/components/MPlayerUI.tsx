import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import MenuIcon from "@mui/icons-material/Menu";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { Alert, Avatar, IconButton, Slide, SlideProps, Snackbar } from "@mui/material";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import * as React from "react";
import { useGlobalAudioPlayer } from "react-use-audio-player";
import { apiAssetUrl } from "@lib/axios";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { toggleView } from "../store/playerGuiSlice";
import { ControlButton } from "./ControlButton";
import { PlayingSlider } from "./PlayingSlider";
import { AlbumImage } from "./SongInfo";
import { VolumeController } from "./VolumeController";
import { nextTrack } from "../store/playerSlice";
import type { Song, Video } from "@features/library";
import { SongBitDepth, VideoBitDepth } from "./SongBitDepth";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { SongActionsMenu } from "@components/media/MediaActionsMenu";
import { LyricsLanguageButton } from "@features/lyrics";
import { AddToPlaylistDialog, type PlaylistItemInput } from "@features/playlist";

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

function normalizeAudioPlayerError(error: unknown): string {
  if (typeof error === "string" || typeof error === "number") return String(error).trim();
  if (error instanceof Error) return error.message.trim();
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" || typeof message === "number") {
      return String(message).trim();
    }
  }
  return "";
}

function formatAudioPlayerError(error: unknown): string {
  const normalizedError = normalizeAudioPlayerError(error);

  switch (normalizedError) {
    case "1":
      return "Playback was interrupted before the track could load.";
    case "2":
      return "The track could not be loaded because of a network problem.";
    case "3":
      return "The track could not be decoded by this player.";
    case "4":
      return "The track could not be loaded or the audio format is not supported.";
    default:
      return normalizedError || "The track could not be played.";
  }
}

export function MPlayerUI() {
  const timeoutRef = React.useRef<any>();
  const dispatch = useAppDispatch();
  const { playingTrack } = useAppSelector((state) => state.player);
  const { videoUrl } = useAppSelector((state) => state.playerVideoControl);
  const expandedPlayerOpen = useAppSelector((state) => state.playerGui.expandedPlayer);
  const lyricsOpen = useAppSelector((state) => state.playerGui.lyrics);
  const { error } = useGlobalAudioPlayer();
  const playerErrorMessage = React.useMemo(() => formatAudioPlayerError(error), [error]);
  const [actionsAnchor, setActionsAnchor] = React.useState<HTMLElement | null>(null);
  const [addToPlaylistOpen, setAddToPlaylistOpen] = React.useState(false);
  const playlistItems = React.useMemo<PlaylistItemInput[]>(() => {
    if (!playingTrack) return [];
    return [
      {
        mediaType: playingTrack.type === "video" ? "video" : "audio",
        mediaId: playingTrack._id
      }
    ];
  }, [playingTrack]);

  React.useEffect(() => {
    clearTimeout(timeoutRef.current);
    if (error != null) {
      console.log("player error", playerErrorMessage, { error });
      timeoutRef.current = setTimeout(() => {
        dispatch(nextTrack());
      }, 5000);
    }
  }, [dispatch, error, playerErrorMessage]);

  if (playingTrack == null) return null;
  return (
    <>
      <Snackbar
        anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
        TransitionComponent={SlideTransition}
        open={error != null}
        autoHideDuration={5000}
      >
        <Alert severity="error" variant="filled" sx={{ width: "100%" }}>
          {playerErrorMessage}
        </Alert>
      </Snackbar>
      <Grid
        container
        role="button"
        tabIndex={0}
        aria-label="Toggle full screen player"
        onClick={() => dispatch(toggleView("expandedPlayer"))}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            dispatch(toggleView("expandedPlayer"));
          }
        }}
        sx={{
          background: "transparent",
          minHeight: 0,
          mx: 0,
          width: "100%",
          alignItems: "center",
          flexWrap: "nowrap",
          columnGap: { xs: 1, sm: 1.5 }
        }}
      >
        <Grid
          item
          xs
          sx={{
            display: { xs: expandedPlayerOpen ? "none" : "flex", sm: "flex" },
            alignItems: "center",
            minWidth: 0,
            flex: { xs: "1 1 auto", sm: "1 1 34%" },
            maxWidth: { sm: "34%" },
            overflow: "hidden"
          }}
        >
          <AlbumImage hideArtworkBelow="responsiveMedia">
            {playingTrack.type === "audio" ? (
              <Avatar
                sx={{
                  borderRadius: "7px",
                  height: { xs: 52, sm: 54 },
                  width: { xs: 52, sm: 54 },
                  flexShrink: 0
                }}
                src={apiAssetUrl(`/song/${playingTrack?._id}/cover`)}
              >
                <MusicNoteIcon />
              </Avatar>
            ) : videoUrl ? (
              <Box
                data-video-player-anchor
                sx={{
                  width: { xs: 72, sm: 112 },
                  height: { xs: 48, sm: 64 },
                  flexShrink: 0,
                  borderRadius: "7px",
                  overflow: "hidden"
                }}
              />
            ) : (
              <div>No video</div>
            )}
          </AlbumImage>
          <Box sx={{ display: { xs: "none", sm: "flex" }, flexShrink: 0 }}>
            <IconButton
              aria-label="Add to Playlist"
              disabled={!playingTrack}
              onClick={(event) => {
                event.stopPropagation();
                setAddToPlaylistOpen(true);
              }}
            >
              <FavoriteBorderIcon sx={{ fontSize: 22 }} />
            </IconButton>
            <IconButton
              aria-label="Player track actions"
              onClick={(event) => {
                event.stopPropagation();
                setActionsAnchor(event.currentTarget);
              }}
            >
              <MoreHorizIcon />
            </IconButton>
          </Box>
        </Grid>

        <Grid
          item
          xs="auto"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          sx={{
            flex: { xs: "0 0 auto", sm: "1 1 38%" },
            maxWidth: { sm: "38%" },
            minWidth: { xs: 88, sm: 150 }
          }}
        >
          <ControlButton />
          <PlayingSlider />
        </Grid>

        <Grid
          item
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          sx={{
            display: { xs: "none", sm: "flex" },
            flex: "1 1 28%",
            minWidth: 0
          }}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              display: "flex",
              alignItems: "center",
              columnGap: { sm: "2px", md: "8px" }
            }}
          >
            {lyricsOpen && <LyricsLanguageButton />}
            <IconButton
              aria-label="Open play queue"
              onClick={(e) => {
                e.stopPropagation();
                dispatch(toggleView("playingQueue"));
              }}
            >
              <MenuIcon />
            </IconButton>
            <VolumeController />
            <Box sx={{ display: { xs: "none", md: "flex" } }}>
              {playingTrack.type === "audio" ? (
                <SongBitDepth song={playingTrack as Song} />
              ) : (
                <VideoBitDepth video={playingTrack as Video} />
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>
      <SongActionsMenu
        track={playingTrack}
        open={Boolean(actionsAnchor)}
        anchorEl={actionsAnchor}
        onClose={() => setActionsAnchor(null)}
      />
      <AddToPlaylistDialog
        open={addToPlaylistOpen}
        onClose={() => setAddToPlaylistOpen(false)}
        items={playlistItems}
      />
    </>
  );
}
