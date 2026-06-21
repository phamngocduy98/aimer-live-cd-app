import FiberManualRecordRoundedIcon from "@mui/icons-material/FiberManualRecordRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import { Box, Button, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { SongTable } from "@components/media/SongTable";
import { MediaDetailHero, MediaDetailIdentity } from "@components/view/MediaDetailPage";
import { PageScaffold } from "@components/view/PageScaffold";
import { SectionHeader } from "@components/view/SectionHeader";
import { DetailActions, DetailContent, PageState } from "@components/view/designSystem";
import { mediaArtworkUrl } from "@utils/mediaArtwork";
import { playRadio, setRadioListening } from "@features/player/store/playerSlice";
import { useRadioState } from "../hooks/useRadio";
import type { RadioRequester } from "../types";

export function RadioPage() {
  const dispatch = useAppDispatch();
  const { data, isLoading, isError } = useRadioState();
  const session = useAppSelector((state) => state.auth.session);
  const radio = useAppSelector((state) => state.player.radio);
  const current = data?.current ?? null;
  const artworkUrl = mediaArtworkUrl(current?.media);
  const isCurrentSlot = radio.enabled && radio.slotId === current?.slotId;
  const listening = isCurrentSlot && radio.listening;
  const listenerCount = data?.listenerCount ?? 0;
  const paused = Boolean(data?.stationStatus.paused);

  const start = () => {
    if (!current || !data) return;
    dispatch(
      playRadio({
        media: current.media,
        mediaType: current.mediaType,
        slotId: current.slotId,
        startedAt: current.startedAt,
        serverTime: data.serverTime,
        position: current.position,
        duration: current.duration,
        streamUrl: current.streamUrl,
        paused: data.stationStatus.paused,
        history: data.history
      })
    );
  };

  if (isLoading) return <PageState state="loading" />;
  if (isError) return <PageState state="error" message="Radio is unavailable." />;

  const historyItems = current ? [current, ...(data?.history ?? [])] : (data?.history ?? []);
  const historyMedia = [...historyItems]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .map((item) => ({
      ...item.media,
      type: item.mediaType,
      radioSlotId: item.slotId,
      radioPlayedAt: item.startedAt,
      radioRequestedByUser: item.requestedByUser
    }));
  const upcoming = data?.upcoming ?? [];
  const upcomingMedia = upcoming.map((item) => ({
    ...item.media,
    type: item.mediaType,
    radioQueueItemId: item.queueItemId,
    radioQueuePosition: item.position,
    radioRequestedByUser: item.requestedByUser
  }));

  return (
    <PageScaffold>
      <MediaDetailHero
        testId="radio-media-hero"
        backgroundImage={
          artworkUrl
            ? {
                xs: `linear-gradient(180deg, rgba(0,0,0,.16) 0%, rgba(0,0,0,.4) 44%, #000 100%), url("${artworkUrl}")`,
                md: `linear-gradient(180deg, rgba(0,0,0,.2) 0%, rgba(0,0,0,.48) 56%, #000 100%), linear-gradient(90deg, rgba(0,0,0,.72), rgba(0,0,0,.18) 72%), url("${artworkUrl}")`
              }
            : undefined
        }
      >
        <MediaDetailIdentity
          hideArtwork
          artwork={null}
          title="Radio"
          subtitle={
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                justifyContent: { xs: "center", sm: "flex-start" },
                gap: 1.25,
                color: "rgba(255,255,255,.78)"
              }}
            >
              <Typography component="span" fontSize={13} fontWeight={700}>
                {listenerCount} listening
              </Typography>
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontSize: 13,
                  fontWeight: 700
                }}
              >
                {paused ? (
                  <PauseRoundedIcon sx={{ fontSize: 16, color: "rgba(255,255,255,.74)" }} />
                ) : (
                  <FiberManualRecordRoundedIcon sx={{ fontSize: 11, color: "#ff3b30" }} />
                )}
                {paused ? "Paused" : "Live"}
              </Box>
            </Box>
          }
        />
        <DetailActions
          primary={
            <Button
              variant="contained"
              size="large"
              disabled={!current}
              startIcon={listening ? <StopRoundedIcon /> : <PlayArrowRoundedIcon />}
              aria-label={listening ? "Stop radio" : "Listen to radio"}
              onClick={() => (listening ? dispatch(setRadioListening(false)) : start())}
              sx={{
                minHeight: 50,
                px: 4,
                bgcolor: "#fff",
                color: "#000",
                borderRadius: "999px",
                fontSize: 16,
                fontWeight: 700,
                "&:hover": { bgcolor: "#e9e9e9" }
              }}
            >
              {listening ? "Stop" : "Listen"}
            </Button>
          }
        />
      </MediaDetailHero>

      <DetailContent compactGutter sx={{ pt: 3, pb: 6 }}>
        {session.canAccessPaidMedia && upcoming.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <SectionHeader title="Next up" />
            <SongTable
              songs={upcomingMedia}
              ariaLabel="next up radio table"
              readOnly
              showArtwork
              showActions={false}
              showAddToPlaylist={false}
              showAlbum={false}
              showQuality={false}
              showRequestedBy
              getRowKey={(item) => item.radioQueueItemId}
              getIndexLabel={(item) => item.radioQueuePosition}
              getRequestedByLabel={(item) => formatRequester(item.radioRequestedByUser)}
              mobileSubtitle="artist"
            />
          </Box>
        )}

        <SectionHeader title="Recently played" />
        {historyMedia.length > 0 ? (
          <SongTable
            songs={historyMedia}
            ariaLabel="recently played radio table"
            readOnly
            showArtwork
            showActions={false}
            showAddToPlaylist={false}
            showQuality={false}
            showRequestedBy
            showPlayedAt
            getRowKey={(item) => item.radioSlotId}
            getIsActive={(item) => item.radioSlotId === current?.slotId}
            getRequestedByLabel={(item) => formatRequester(item.radioRequestedByUser)}
            getPlayedAtLabel={(item) => formatPlaybackTime(item.radioPlayedAt)}
            mobileSubtitle="artist"
          />
        ) : (
          <Typography color="text.secondary">
            Recently played radio will appear after playback starts.
          </Typography>
        )}
      </DetailContent>
    </PageScaffold>
  );
}

function formatRequester(user?: RadioRequester): string {
  if (!user) return "Radio";
  return user.displayName || user.username || "Unknown user";
}

function formatPlaybackTime(value?: string): string {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
