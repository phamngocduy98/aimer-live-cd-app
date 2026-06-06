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
import ReactPlayer from "react-player";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import {
  loadVideo,
  loopVideo,
  stopVideo,
  videoOnBuffer,
  videoOnBufferEnd,
  videoOnError,
  videoOnReady,
  videoOnSeek
} from "../store/playerVideoControl";
import { onVideoPostion } from "../thunks/onVideoPosition";
import { FavoriteButton } from "./FavoriteButton";
import { SongActionsMenu } from "@components/media/MediaActionsMenu";

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export function MPlayerUI() {
  const timeoutRef = React.useRef<any>();
  const videoRef = React.useRef<ReactPlayer | null>(null);
  const dispatch = useAppDispatch();
  const { playingTrack, repeat } = useAppSelector((state) => state.player);
  const { videoVolume, videoUrl, videoPlaying, videoLoop, videoSeekPosition, videoPosition } =
    useAppSelector((state) => state.playerVideoControl);
  const showMobilePlayer = useAppSelector((state) => state.playerGui.mobilePlayer);
  const { load, stop, loop, volume, src, error, playing } = useGlobalAudioPlayer();
  const [actionsAnchor, setActionsAnchor] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    clearTimeout(timeoutRef.current);
    if (error != null) {
      console.log("error", error);
      timeoutRef.current = setTimeout(() => {
        dispatch(nextTrack());
      }, 5000);
    }
  }, [error]);

  React.useEffect(() => {
    if (videoSeekPosition != null) {
      console.log("User seek to", videoSeekPosition);
      videoRef.current?.seekTo(videoSeekPosition, "seconds");
      dispatch(videoOnSeek({ position: null }));
    }
  }, [videoSeekPosition]);

  React.useEffect(() => {
    if (!showMobilePlayer) {
      videoRef.current?.seekTo(videoPosition);
      console.log("seek to ", videoPosition);
    }
  }, [showMobilePlayer]);

  React.useEffect(() => {
    if (playingTrack == null) {
      if (playing) stop();
      if (videoPlaying) dispatch(stopVideo());
      return;
    }

    let newSrc = apiAssetUrl(`/stream/${playingTrack.type}/${playingTrack._id}`);
    // support youtubeUrl
    if ((playingTrack as Video).youtubeUrl != null) {
      newSrc = (playingTrack as Video).youtubeUrl!;
    }

    if (newSrc === src || newSrc === videoUrl) {
      if (playingTrack.type == "audio") {
        loop(repeat === 2);
      } else {
        dispatch(loopVideo({ loopOnOff: repeat === 2 }));
      }
      return;
    }

    if (playingTrack.type == "audio") {
      load(newSrc, {
        autoplay: true,
        html5: true, // playingTrack.size > 3 * 1024 * 1024
        initialVolume: volume,
        format: playingTrack.fileExtension,
        loop: repeat === 2,
        onend: () => {
          dispatch(nextTrack());
        }
      });
    } else {
      dispatch(loadVideo({ url: newSrc }));
    }
  }, [playingTrack, volume, repeat, videoUrl]);

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
          {error}
        </Alert>
      </Snackbar>
      <Grid
        container
        role="button"
        tabIndex={0}
        aria-label="Toggle full screen player"
        onClick={() => dispatch(toggleView("mobilePlayer"))}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            dispatch(toggleView("mobilePlayer"));
          }
        }}
        sx={{
          background: "transparent",
          minHeight: { xs: 72, sm: 84 },
          padding: { xs: "10px 14px 4px", sm: "8px 14px" },
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
            display: { xs: showMobilePlayer ? "none" : "flex", sm: "flex" },
            alignItems: "center",
            minWidth: 0,
            flexBasis: { sm: "34%" },
            maxWidth: { sm: "34%" }
          }}
        >
          <AlbumImage>
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
              <ReactPlayer
                ref={videoRef}
                height={"64px"}
                width={"112px"}
                config={{
                  youtube: {
                    embedOptions: {
                      width: "100%",
                      height: "100%"
                    },
                    playerVars: {
                      autoplay: 1
                    }
                  }
                }}
                playing={videoPlaying && !showMobilePlayer}
                url={videoUrl}
                loop={videoLoop}
                volume={videoVolume}
                onReady={() => dispatch(videoOnReady())}
                onError={(e) => dispatch(videoOnError({ error: `${e}` }))}
                onBuffer={() => dispatch(videoOnBuffer())}
                onBufferEnd={() => dispatch(videoOnBufferEnd())}
                onProgress={(state) => dispatch(onVideoPostion(state.playedSeconds))}
                onEnded={() => dispatch(nextTrack())}
              />
            ) : (
              <div>No video</div>
            )}
          </AlbumImage>
          <FavoriteButton size={22} />
          <IconButton
            aria-label="Player track actions"
            onClick={(event) => {
              event.stopPropagation();
              setActionsAnchor(event.currentTarget);
            }}
          >
            <MoreHorizIcon />
          </IconButton>
        </Grid>

        <Grid
          item
          xs="auto"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          sx={{
            flexBasis: { sm: "38%" },
            maxWidth: { sm: "38%" },
            minWidth: { xs: 88, sm: 0 }
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
    </>
  );
}
