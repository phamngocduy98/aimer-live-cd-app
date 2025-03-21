import ClearAllIcon from "@mui/icons-material/ClearAll";
import CloseIcon from "@mui/icons-material/Close";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import {
  Avatar,
  Box,
  IconButton,
  Tooltip,
  tooltipClasses,
  TooltipProps,
  Typography
} from "@mui/material";

import styled from "@emotion/styled";
import Grid from "@mui/material/Unstable_Grid2";
import React, { useEffect } from "react";
import ReactPlayer from "react-player";
import { AppAPI } from "../../core/api";
import { router } from "../../router";
import { useAppDispatch, useAppSelector } from "../../store/hook";
import { hideView, toggleView } from "../../store/player/playerGuiSlice";
import { nextTrack, reset } from "../../store/player/playerSlice";
import {
  videoOnBuffer,
  videoOnBufferEnd,
  videoOnError,
  videoOnReady,
  videoOnSeek
} from "../../store/player/playerVideoControl";
import { onVideoPostion } from "../../store/thunks/onVideoPosition";
import { QueueList } from "./FloatingQueueList";
import "./player.css";
import { isVideo } from "../../core/Video";

export const MobilePlayer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { playingTrack } = useAppSelector((state) => state.player);
  return (
    <Box
      sx={{
        width: "100dvw",
        height: "100dvh",
        backgroundImage: `linear-gradient(rgba(225, 222, 184, 0.28) 0%, rgba(225, 222, 184, 0) 90.67%)`,
        backgroundColor: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        userSelect: "none"
      }}
    >
      <TopPlayingFrom />

      <Grid
        container
        sx={{
          width: "100%",
          padding: {
            xs: 0,
            sm: "16px 24px"
          },
          overflowY: {
            sm: "auto",
            md: "hidden"
          },
          marginBottom: "90px"
        }}
      >
        <Grid xs={12} sm={12} md={6}>
          <PlayingAlbumCover />
        </Grid>
        <Grid
          md={6}
          sm={12}
          sx={{
            display: {
              xs: "none",
              sm: "flex"
            },
            overflowY: {
              sm: "hidden",
              md: "auto"
            },
            height: {
              sm: "auto",
              md: "100%"
            },
            position: "relative"
          }}
        >
          <QueueList />

          <div
            style={{
              position: "fixed",
              bottom: "110px",
              right: "48px",
              zIndex: 1200,
              display: "flex",
              columnGap: "10px"
            }}
          >
            {/* <IconButton
              sx={{
                "&:hover": {
                  backgroundColor: "#fcfcfc29",
                },
                backgroundColor: "#fcfcfc29",
                borderRadius: "10px",
              }}
            >
              <PlaylistAddIcon />
            </IconButton> */}
            <MTooltip title={"Clear play queue"} placement="top" arrow>
              <IconButton
                sx={{
                  "&:hover": {
                    backgroundColor: "#fcfcfc29"
                  },
                  backgroundColor: "#fcfcfc29",
                  borderRadius: "10px"
                }}
                onClick={() => dispatch(reset({ songs: [], type: "audio" }))}
              >
                <ClearAllIcon />
              </IconButton>
            </MTooltip>
          </div>
        </Grid>
      </Grid>
    </Box>
  );
};

const TopPlayingFrom = () => {
  const dispatch = useAppDispatch();
  const { playingTrack } = useAppSelector((state) => state.player);
  return (
    <Grid
      container
      width={"100%"}
      spacing={"16px"}
      sx={{ padding: "24px 16px" }}
      alignItems={"center"}
      justifyContent={"center"}
    >
      <Grid xs display={"flex"} flexDirection={"column"} rowGap={"4px"}>
        <Typography
          noWrap
          fontSize={9}
          letterSpacing={"1.2px"}
          color="#afafb6"
          textOverflow={"ellipsis"}
          fontWeight={600}
          textTransform={"uppercase"}
        >
          Playing from:
        </Typography>
        <Typography
          noWrap
          fontSize={"12px"}
          textOverflow={"ellipsis"}
          lineHeight={"18px"}
          letterSpacing={0}
          fontWeight={600}
          sx={{
            "&:hover": {
              textDecoration: "underline",
              cursor: "pointer"
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            dispatch(hideView("mobilePlayer"));
            router.navigate(`/album/${playingTrack?.album?._id}`);
          }}
        >
          {playingTrack?.album?.title}
        </Typography>
      </Grid>
      <Grid xs={"auto"}>
        <IconButton
          size="small"
          sx={{ background: "#ffffff1a" }}
          onClick={() => dispatch(hideView("mobilePlayer"))}
        >
          <CloseIcon />
        </IconButton>
      </Grid>
      {/* <Box display={"flex"}>
        <Button onClick={() => dispatch(hideView("mobilePlayer"))}>
          Minimize
        </Button>

        <Button onClick={() => dispatch(toggleView("playingQueue"))}>
          Playing queue
        </Button>
      </Box> */}
    </Grid>
  );
};

const PlayingAlbumCover = () => {
  const videoRef = React.useRef<ReactPlayer | null>(null);
  const dispatch = useAppDispatch();
  const showMobilePlayer = useAppSelector((state) => state.playerGui.mobilePlayer);
  const playingTrack = useAppSelector((state) => state.player.playingTrack);

  const currentChapter = useAppSelector(
    (state) => state.player.chapters[state.player.currentChapterIdx ?? -1]
  );

  const { videoVolume, videoUrl, videoPlaying, videoLoop, videoSeekPosition, videoPosition } =
    useAppSelector((state) => state.playerVideoControl);

  useEffect(() => {
    if (showMobilePlayer) {
      videoRef.current?.seekTo(videoPosition);
      console.log("seek to ", videoPosition);
    }
  }, [showMobilePlayer]);

  React.useEffect(() => {
    if (videoSeekPosition != null) {
      console.log("User seek to", videoSeekPosition);
      videoRef.current?.seekTo(videoSeekPosition, "seconds");
      dispatch(videoOnSeek({ position: null }));
    }
  }, [videoSeekPosition]);

  return (
    <Box
      sx={{
        padding: "0 24px",
        display: "flex",
        flexDirection: "column",
        width: "100%"
      }}
    >
      {playingTrack?.type === "audio" ? (
        <Box
          sx={{
            borderRadius: "0px",
            width: "35vh",
            maxWidth: "calc(100% - 48px)",
            margin: "0 auto"
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: "0px",
              paddingBottom: "100%",
              position: "relative"
            }}
          >
            <Box
              sx={{
                width: "100%",
                height: "100%",
                position: "absolute",
                borderRadius: "8px"
              }}
            >
              <Avatar
                sx={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "8px"
                }}
                src={`${AppAPI.HOST}/album/${playingTrack?.album?._id}/cover`}
              >
                <MusicNoteIcon />
              </Avatar>
            </Box>
          </Box>
        </Box>
      ) : videoUrl ? (
        <div
          className="my-player"
          style={{
            display: "flex",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              width: isVideo(playingTrack) && playingTrack.youtubeUrl != null ? "100%" : undefined
            }}
          >
            <ReactPlayer
              ref={videoRef}
              width={"100%"}
              height={"100%"}
              config={{
                youtube: {
                  embedOptions: {
                    width: "100%",
                    height: "100%"
                  }
                }
              }}
              style={{
                borderRadius: "8px",
                overflow: "hidden",
                border: ".5px solid #ffffff1a",
                boxShadow: "0 20px 50px 5px #00000038,0 20px 40px 0 #00000024",
                maxHeight: "calc(100dvh - 440px)"
              }}
              playing={videoPlaying && showMobilePlayer}
              url={videoUrl}
              loop={videoLoop}
              volume={videoVolume}
              onReady={() => (showMobilePlayer ? dispatch(videoOnReady()) : null)}
              onError={(e) => (showMobilePlayer ? dispatch(videoOnError({ error: `${e}` })) : null)}
              onBuffer={() => (showMobilePlayer ? dispatch(videoOnBuffer()) : null)}
              onBufferEnd={() => (showMobilePlayer ? dispatch(videoOnBufferEnd()) : null)}
              onProgress={(state) =>
                showMobilePlayer ? dispatch(onVideoPostion(state.playedSeconds)) : null
              }
              onEnded={() => dispatch(nextTrack())}
            />
          </div>
        </div>
      ) : (
        <div>No video</div>
      )}

      <Grid container sx={{ marginTop: "32px" }}>
        <Grid xs display={"flex"} flexDirection={"column"}>
          <Typography
            component="div"
            fontWeight={700}
            lineHeight={"28px"}
            fontSize="20px"
            sx={{
              textOverflow: "ellipsis",
              paddingTop: 2,
              "&:hover": {
                textDecoration: "underline",
                cursor: "pointer"
              },
              textAlign: {
                xs: "start",
                sm: "center"
              }
            }}
            noWrap
            textOverflow="ellipsis"
            onClick={(e) => {
              e.stopPropagation();
              dispatch(hideView("mobilePlayer"));
              router.navigate(`/album/${playingTrack?.album?._id}`);
            }}
          >
            {currentChapter != null
              ? `${[currentChapter.title, currentChapter.subTitle].filter((t) => t).join(" - ")}`
              : playingTrack?.title}
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            component="div"
            fontSize={"16px"}
            lineHeight="16px"
            fontWeight={600}
            marginTop={"8px"}
            sx={{
              "&:hover": {
                textDecoration: "underline",
                cursor: "pointer"
              },
              textAlign: {
                xs: "start",
                sm: "center"
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              dispatch(hideView("mobilePlayer"));
              router.navigate(`/`);
            }}
          >
            {playingTrack?.artist}
          </Typography>
        </Grid>
        <Grid
          xs={"auto"}
          alignItems={"center"}
          sx={{
            display: {
              xs: "flex",
              sm: "none"
            }
          }}
        >
          <IconButton>
            <FavoriteBorderIcon />
          </IconButton>
          <IconButton onClick={() => dispatch(toggleView("playingQueue"))}>
            <MoreHorizIcon />
          </IconButton>
        </Grid>
      </Grid>
    </Box>
  );
};

const MTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#242429",
    color: "white",
    fontSize: 11,
    textAlign: "center",
    // @ts-ignore
    boxShadow: theme.shadows[1]
  }
}));
