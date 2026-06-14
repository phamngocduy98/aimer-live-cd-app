import React from "react";
import ReactPlayer from "react-player";
import { Box } from "@mui/material";
import { useGlobalAudioPlayer } from "react-use-audio-player";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { apiAssetUrl } from "@lib/axios";
import { isVideo } from "@features/library";
import { nextTrack } from "../store/playerSlice";
import { showView } from "../store/playerGuiSlice";
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
import { mediaSourcePath } from "../types";
import { NaturalVideoSize, resolveVideoSize } from "../videoAspect";

export function PlaybackEngine() {
  const dispatch = useAppDispatch();
  const videoRef = React.useRef<ReactPlayer | null>(null);
  const [compactRect, setCompactRect] = React.useState<DOMRect | null>(null);
  const [naturalVideoSize, setNaturalVideoSize] = React.useState<NaturalVideoSize | null>(null);
  const playingTrack = useAppSelector((state) => state.player.playingTrack);
  const expanded = useAppSelector((state) => state.playerGui.mobilePlayer);
  const { repeat } = useAppSelector((state) => state.player);
  const {
    videoUrl,
    videoPlaying,
    videoLoop,
    videoVolume,
    videoSeekPosition,
    videoIsReady,
    videoLoadedMediaId,
    videoSeekMediaId
  } = useAppSelector((state) => state.playerVideoControl);
  const { load, stop, loop, volume, src, playing } = useGlobalAudioPlayer();
  const videoSourceKey =
    playingTrack && isVideo(playingTrack) ? `${playingTrack._id}:${videoUrl ?? ""}` : "";

  const syncNaturalVideoSize = React.useCallback(() => {
    const internalPlayer = videoRef.current?.getInternalPlayer();
    if (!(internalPlayer instanceof HTMLVideoElement)) return;

    const width = internalPlayer.videoWidth;
    const height = internalPlayer.videoHeight;
    if (width <= 0 || height <= 0) return;

    setNaturalVideoSize((current) => {
      if (
        current?.sourceKey === videoSourceKey &&
        current.width === width &&
        current.height === height
      ) {
        return current;
      }
      return { sourceKey: videoSourceKey, width, height };
    });
  }, [videoSourceKey]);

  React.useEffect(() => {
    setNaturalVideoSize(null);
  }, [videoSourceKey]);

  React.useEffect(() => {
    if (!playingTrack) {
      if (playing) stop();
      if (videoPlaying) dispatch(stopVideo());
      return;
    }

    const video = isVideo(playingTrack);
    const sourcePath = mediaSourcePath(playingTrack);
    const nextSource = sourcePath.startsWith("/") ? apiAssetUrl(sourcePath) : sourcePath;

    if (video) {
      if (playing) stop();
      if (nextSource !== videoUrl)
        dispatch(loadVideo({ url: nextSource, mediaId: playingTrack._id }));
      else dispatch(loopVideo({ loopOnOff: repeat === 2 }));
      return;
    }

    if (videoPlaying) dispatch(stopVideo());
    if (nextSource !== src) {
      load(nextSource, {
        autoplay: true,
        html5: true,
        initialVolume: volume,
        format: playingTrack.fileExtension,
        loop: repeat === 2,
        onend: () => {
          dispatch(nextTrack());
        }
      });
    } else {
      loop(repeat === 2);
    }
  }, [
    dispatch,
    load,
    loop,
    playing,
    playingTrack,
    repeat,
    src,
    stop,
    videoPlaying,
    videoUrl,
    volume
  ]);

  React.useEffect(() => {
    if (
      videoSeekPosition == null ||
      !videoIsReady ||
      !isVideo(playingTrack) ||
      videoLoadedMediaId !== playingTrack._id ||
      videoSeekMediaId !== playingTrack._id
    ) {
      return;
    }
    videoRef.current?.seekTo(videoSeekPosition, "seconds");
    dispatch(videoOnSeek({ position: null }));
  }, [
    dispatch,
    playingTrack,
    videoIsReady,
    videoLoadedMediaId,
    videoSeekMediaId,
    videoSeekPosition
  ]);

  React.useLayoutEffect(() => {
    if (expanded) return;

    let frame = 0;
    let measurementStartedAt = performance.now();
    let observer: ResizeObserver | undefined;
    let anchor: HTMLElement | null = null;
    let anchorContainer: HTMLElement | null = null;
    const updateRect = () => {
      anchor ??= document.querySelector<HTMLElement>("[data-video-player-anchor]");
      if (!anchor) return;
      setCompactRect(anchor.getBoundingClientRect());
      if (performance.now() - measurementStartedAt < 420) {
        frame = requestAnimationFrame(updateRect);
      }
    };
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      measurementStartedAt = performance.now();
      frame = requestAnimationFrame(updateRect);
    };

    anchor = document.querySelector<HTMLElement>("[data-video-player-anchor]");
    if (anchor) {
      anchorContainer = anchor.parentElement;
      observer = new ResizeObserver(scheduleUpdate);
      observer.observe(anchor);
      if (anchorContainer) observer.observe(anchorContainer);
      anchor.addEventListener("transitionrun", scheduleUpdate);
      anchor.addEventListener("transitionend", scheduleUpdate);
      anchorContainer?.addEventListener("transitionrun", scheduleUpdate);
      anchorContainer?.addEventListener("transitionend", scheduleUpdate);
    }
    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      anchor?.removeEventListener("transitionrun", scheduleUpdate);
      anchor?.removeEventListener("transitionend", scheduleUpdate);
      anchorContainer?.removeEventListener("transitionrun", scheduleUpdate);
      anchorContainer?.removeEventListener("transitionend", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
    };
  }, [expanded, playingTrack?._id]);

  if (!videoUrl || !isVideo(playingTrack)) return null;

  const { width, height } = resolveVideoSize(
    videoSourceKey,
    naturalVideoSize,
    playingTrack.videoWidth,
    playingTrack.videoHeight
  );
  const landscape = width >= height;
  const compactVisible = Boolean(compactRect && compactRect.width > 0 && compactRect.height > 0);

  return (
    <Box
      data-testid="persistent-video-runtime"
      sx={{
        position: "fixed",
        zIndex: expanded ? 1300 : 1203,
        bgcolor: expanded ? { xs: "transparent", sm: "#000" } : "#000",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        visibility: expanded || compactVisible ? "visible" : "hidden",
        transition: "none",
        ...(expanded
          ? {
              top: { xs: 86, sm: 0 },
              left: { xs: 20, sm: 0 },
              right: { xs: 20, sm: 0 },
              bottom: { xs: 300, sm: 0 },
              width: { xs: "calc(100dvw - 40px)", sm: "100dvw" },
              height: "auto"
            }
          : {
              top: compactRect?.top ?? "auto",
              left: compactRect?.left ?? 22,
              bottom: compactRect ? "auto" : 20,
              width: compactRect?.width ?? 56,
              height: compactRect?.height ?? 52,
              borderRadius: "7px"
            }),
        "& video, & iframe": {
          width: "100% !important",
          height: "100% !important"
        },
        "& video": { objectFit: "contain", display: "block" },
        "& iframe": { pointerEvents: "none" }
      }}
    >
      <Box
        data-video-aspect-frame
        sx={{
          position: expanded ? "absolute" : "relative",
          top: expanded ? "50%" : "auto",
          left: expanded ? "50%" : "auto",
          transform: expanded ? "translate(-50%, -50%)" : "none",
          width: expanded ? (landscape ? "100%" : "auto") : "100%",
          height: expanded ? (landscape ? "auto" : "100%") : "100%",
          maxWidth: "100%",
          maxHeight: "100%",
          aspectRatio: `${width} / ${height}`,
          flex: "0 1 auto",
          bgcolor: expanded ? { xs: "transparent", sm: "#000" } : "#000",
          "& > div": { width: "100% !important", height: "100% !important" }
        }}
      >
        <ReactPlayer
          key={videoUrl}
          ref={videoRef}
          width="100%"
          height="100%"
          playing={videoPlaying}
          url={videoUrl}
          loop={videoLoop}
          volume={videoVolume}
          config={{
            youtube: {
              playerVars: {
                controls: 0,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
                modestbranding: 1,
                playsinline: 1,
                rel: 0
              }
            }
          }}
          onReady={() => {
            syncNaturalVideoSize();
            dispatch(videoOnReady());
          }}
          onStart={syncNaturalVideoSize}
          onDuration={syncNaturalVideoSize}
          onError={(error) => dispatch(videoOnError({ error: `${error}` }))}
          onBuffer={() => dispatch(videoOnBuffer())}
          onBufferEnd={() => dispatch(videoOnBufferEnd())}
          onProgress={(state) => dispatch(onVideoPostion(state.playedSeconds))}
          onEnded={() => dispatch(nextTrack())}
        />
      </Box>
      {!expanded && (
        <Box
          component="button"
          type="button"
          aria-label="Expand video player"
          onClick={() => dispatch(showView("mobilePlayer"))}
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            p: 0,
            border: 0,
            bgcolor: "transparent",
            cursor: "pointer"
          }}
        />
      )}
    </Box>
  );
}
