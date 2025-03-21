import MenuIcon from "@mui/icons-material/Menu";
import {
  Alert,
  Avatar,
  Button,
  Chip,
  IconButton,
  Slide,
  SlideProps,
  Snackbar
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import Box from "@mui/material/Box";
import * as React from "react";
import { useGlobalAudioPlayer } from "react-use-audio-player";
import { AppAPI } from "../../core/api";
import { useAppDispatch, useAppSelector } from "../../store/hook";
import { toggleView } from "../../store/player/playerGuiSlice";
import { ControlButton } from "./ControlButton";
import { PlayingSlider } from "./PlayingSlider";
import { AlbumImage } from "./SongInfo";
import { VolumeController } from "./VolumeController";
import { nextTrack } from "../../store/player/playerSlice";
import { Song } from "../../core/Song";
import styled from "@emotion/styled";
import { SongBitDepth, VideoBitDepth } from "./SongBitDepth";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Video } from "../../core/Video";
import ReactPlayer from "react-player";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import {
  loadVideo,
  loopVideo,
  stopVideo,
  videoOnBuffer,
  videoOnBufferEnd,
  videoOnError,
  videoOnProgress,
  videoOnReady,
  videoOnSeek
} from "../../store/player/playerVideoControl";
import { onVideoPostion } from "../../store/thunks/onVideoPosition";

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export default function MPlayerUI() {
  const timeoutRef = React.useRef<any>();
  const videoRef = React.useRef<ReactPlayer | null>(null);
  const dispatch = useAppDispatch();
  const { playingTrack, repeat } = useAppSelector((state) => state.player);
  const { videoVolume, videoUrl, videoPlaying, videoLoop, videoSeekPosition, videoPosition } =
    useAppSelector((state) => state.playerVideoControl);
  const showMobilePlayer = useAppSelector((state) => state.playerGui.mobilePlayer);
  const { load, stop, loop, volume, src, error, playing } = useGlobalAudioPlayer();

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

  const onEnd = () => {};

  React.useEffect(() => {
    if (playingTrack == null) {
      if (playing) stop();
      if (videoPlaying) dispatch(stopVideo());
      return;
    }

    let newSrc = `${AppAPI.HOST}/stream/${playingTrack.type}/${playingTrack._id}`;
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
        sx={{
          background: {
            xs: showMobilePlayer ? "transparent" : "rgb(36, 36, 41)",
            sm: "rgb(36, 36, 41)"
          },
          padding: {
            xs: "0px 16px 16px 16px",
            sm: "0px 16px 8px 16px"
          }
        }}
        spacing={"16px"}
      >
        <Grid
          xs
          sm={4}
          sx={{
            display: { xs: showMobilePlayer ? "none" : "flex", sm: "flex" },
            alignItems: "center"
          }}
        >
          <AlbumImage>
            {playingTrack.type === "audio" ? (
              <Avatar
                sx={{ borderRadius: "8px", height: 54, width: 54 }}
                src={`${AppAPI.HOST}/song/${playingTrack?._id}/cover`}
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
        </Grid>

        <Grid
          xs={showMobilePlayer ? 12 : "auto"}
          sm={4}
          display="flex"
          flexDirection="column"
          justifyContent="center"
          sx={{ gap: { xs: showMobilePlayer ? 3 : 0, sm: 0 } }}
        >
          <ControlButton />
          <PlayingSlider />
        </Grid>

        <Grid
          sm={4}
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          sx={{
            display: { xs: "none", sm: "flex" }
          }}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              display: "flex",
              alignItems: "center",
              columnGap: "10px"
            }}
          >
            <Box sx={{ display: { xs: "none", md: "flex" } }}>
              {playingTrack.type === "audio" ? (
                <SongBitDepth song={playingTrack as Song} />
              ) : (
                <VideoBitDepth video={playingTrack as Video} />
              )}
            </Box>
            <VolumeController />
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                dispatch(toggleView("playingQueue"));
              }}
            >
              <MenuIcon />
            </IconButton>
            <IconButton
              sx={{ backgroundColor: "#ebebff1a" }}
              onClick={(e) => {
                e.stopPropagation();
                dispatch(toggleView("mobilePlayer"));
              }}
            >
              {showMobilePlayer ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />}
            </IconButton>
          </Box>
        </Grid>
      </Grid>
    </>
  );
}
