import FiberManualRecordRoundedIcon from "@mui/icons-material/FiberManualRecordRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { playRadio, setRadioListening } from "@features/player/store/playerSlice";
import { mediaArtworkUrl } from "@utils/mediaArtwork";
import { useRadioState } from "../hooks/useRadio";

export function RadioSection() {
  const dispatch = useAppDispatch();
  const { data, isLoading, isError } = useRadioState({ subscribe: false });
  const radio = useAppSelector((state) => state.player.radio);
  const current = data?.current ?? null;
  const artworkUrl = mediaArtworkUrl(current?.media);
  const isCurrentSlot = radio.enabled && radio.slotId === current?.slotId;
  const listening = isCurrentSlot && radio.listening;
  const listenerCount = data?.listenerCount ?? 0;
  const paused = Boolean(data?.stationStatus.paused);

  if (paused) return null;

  const start = () => {
    if (!current) return;
    dispatch(
      playRadio({
        media: current.media,
        mediaType: current.mediaType,
        slotId: current.slotId,
        startedAt: current.startedAt,
        serverTime: data!.serverTime,
        position: current.position,
        duration: current.duration,
        streamUrl: current.streamUrl,
        paused: Boolean(data?.stationStatus.paused),
        history: data?.history
      })
    );
  };

  return (
    <Box component="section" aria-label="Radio" sx={{ mb: 5 }}>
      <Box
        sx={{
          position: "relative",
          minHeight: { xs: 160, sm: 200 },
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          px: { xs: 3, sm: 4 },
          py: 3,
          borderRadius: 4,
          bgcolor: "#151515",
          backgroundImage: artworkUrl
            ? {
                xs: `linear-gradient(90deg, rgba(0,0,0,.82) 0%, rgba(0,0,0,.58) 58%, rgba(0,0,0,.16) 100%), url("${artworkUrl}")`,
                md: `linear-gradient(90deg, rgba(0,0,0,.84) 0%, rgba(0,0,0,.62) 36%, rgba(0,0,0,.18) 74%, rgba(0,0,0,.38) 100%), url("${artworkUrl}")`
              }
            : "linear-gradient(135deg, #282828 0%, #111 64%, #000 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          boxShadow: "0 18px 44px rgba(0,0,0,.28)"
        }}
      >
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            minWidth: 0,
            width: "100%",
            maxWidth: { xs: 280, sm: 360, md: "none" },
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start"
          }}
        >
          <Typography
            component="h2"
            sx={{
              fontSize: { xs: 24, sm: 28 },
              fontWeight: 700,
              lineHeight: 1,
              color: "#fff",
              textShadow: "0 2px 20px rgba(0,0,0,.55)"
            }}
          >
            Radio
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
              mt: 2,
              color: "rgba(255,255,255,.82)",
              fontSize: 15,
              fontWeight: 700
            }}
          >
            <span>{listenerCount} listening</span>
            <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
              <FiberManualRecordRoundedIcon sx={{ fontSize: 11, color: "#ff3b30" }} />
              Live
            </Box>
          </Box>

          <Button
            variant="contained"
            disabled={!current || isLoading || isError}
            startIcon={
              isLoading ? (
                <CircularProgress color="inherit" size={18} />
              ) : listening ? (
                <StopRoundedIcon />
              ) : (
                <PlayArrowRoundedIcon />
              )
            }
            onClick={() => (listening ? dispatch(setRadioListening(false)) : start())}
            sx={{
              mt: { xs: 2, sm: 3.5 },
              minHeight: 48,
              px: 3,
              alignSelf: { xs: "flex-start", md: "flex-end" },
              borderRadius: "999px",
              bgcolor: "#fff",
              color: "#111",
              fontSize: 16,
              fontWeight: 700,
              "&:hover": { bgcolor: "#f0f0f0" }
            }}
          >
            {listening ? "Stop" : "Listen"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
