import CloseIcon from "@mui/icons-material/Close";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { NOW_PLAYING_BACKGROUND, NOW_PLAYING_COLOR } from "@components/media/nowPlayingStyles";
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Typography
} from "@mui/material";
import React from "react";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { deleteTrack, nextTrack, prevTrack, reset, setCurrentChapter } from "../store/playerSlice";
import { hideView } from "../store/playerGuiSlice";
import { isVideo } from "@features/library";
import type { Song, Video } from "@features/library";
import { videoOnSeek } from "../store/playerVideoControl";
import { SongActionsMenu } from "@components/media/MediaActionsMenu";
import { CreatePlaylistDialog } from "@features/playlist";
import { ArtistLinks } from "@components/media/ArtistLinks";
import { mediaArtworkUrl } from "@utils/mediaArtwork";
import type { PlaySource } from "../types";

export const FloatingQueueList = () => {
  const { playingQueue, mobilePlayer } = useAppSelector((state) => state.playerGui);
  const dispatch = useAppDispatch();

  if (mobilePlayer) return null;

  return (
    <Box
      data-testid="compact-queue-transition"
      sx={{
        position: "fixed",
        top: 78,
        right: 18,
        zIndex: 1400,
        width: 390,
        maxWidth: "calc(100dvw - 36px)",
        opacity: playingQueue ? 1 : 0,
        transform: playingQueue ? "translateX(0)" : "translateX(calc(100% + 36px))",
        visibility: playingQueue ? "visible" : "hidden",
        pointerEvents: playingQueue ? "auto" : "none",
        transition:
          "opacity 240ms ease, transform 300ms cubic-bezier(.22, 1, .36, 1), visibility 0s linear " +
          (playingQueue ? "0s" : "300ms")
      }}
    >
      <Paper
        sx={{
          height: "calc(100dvh - 190px)",
          minHeight: 420,
          overflow: "hidden",
          borderRadius: "22px",
          border: "1px solid rgba(255,255,255,.08)",
          bgcolor: "rgba(24,22,19,.94)",
          backgroundImage: "none",
          boxShadow: "0 28px 70px rgba(0,0,0,.48)"
        }}
      >
        <QueuePanel
          onClose={() => dispatch(hideView("playingQueue"))}
          onClear={() => dispatch(reset({ songs: [], type: "audio" }))}
        />
      </Paper>
    </Box>
  );
};

interface QueuePanelProps {
  onClose?: () => void;
  onClear?: () => void;
  mobile?: boolean;
}

export function QueuePanel({ onClose, onClear, mobile = false }: QueuePanelProps) {
  const [tab, setTab] = React.useState<"queue" | "suggested">("queue");
  const [createPlaylistOpen, setCreatePlaylistOpen] = React.useState(false);
  const { playingTrack, queue } = useAppSelector((state) => state.player);
  const playlistItems = React.useMemo(
    () => [
      ...(playingTrack
        ? [
            {
              mediaType: isVideo(playingTrack) ? ("video" as const) : ("audio" as const),
              mediaId: playingTrack._id
            }
          ]
        : []),
      ...queue.map((entry) => ({
        mediaType: isVideo(entry.media) ? ("video" as const) : ("audio" as const),
        mediaId: entry.media._id
      }))
    ],
    [playingTrack, queue]
  );

  return (
    <>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {mobile ? (
          <Box sx={{ display: "flex", justifyContent: "center", gap: 1, py: 2 }}>
            <Button onClick={() => setTab("queue")} sx={queueTabStyles(tab === "queue")}>
              Play queue
            </Button>
            <Button onClick={() => setTab("suggested")} sx={queueTabStyles(tab === "suggested")}>
              Suggested tracks
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", px: 2.5, pt: 2, pb: 1 }}>
            <Typography component="h2" sx={{ flex: 1, fontSize: 24, fontWeight: 700 }}>
              Play queue
            </Typography>
            <IconButton
              aria-label="Create playlist from queue"
              size="small"
              disabled={playlistItems.length === 0}
              onClick={() => setCreatePlaylistOpen(true)}
            >
              <QueueMusicRoundedIcon />
            </IconButton>
            {onClose && (
              <IconButton aria-label="Close play queue" size="small" onClick={onClose}>
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        )}
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: mobile ? 1 : 1.5 }}>
          {tab === "queue" ? <QueueList onClear={onClear} /> : <SuggestedTracks />}
        </Box>
      </Box>
      <CreatePlaylistDialog
        open={createPlaylistOpen}
        onClose={() => setCreatePlaylistOpen(false)}
        items={playlistItems}
      />
    </>
  );
}

export const QueueList: React.FC<{ onClear?: () => void }> = ({ onClear }) => {
  const dispatch = useAppDispatch();
  const { playingTrack, currentEntry, history, queue } = useAppSelector((state) => state.player);
  const currentChapterIdx = useAppSelector((state) => state.player.currentChapterIdx);
  const currentSourceTitle = queueSourceTitle("Playing from", currentEntry?.playFrom);
  const nextSourceTitle = queueSourceTitle("Next up from", queue[0]?.playFrom);

  return (
    <Box sx={{ pb: 3 }}>
      {history.length > 0 && (
        <QueueSection title="History">
          {history.map((entry, idx) => (
            <QueueRow
              key={entry.queueEntryId}
              track={entry.media}
              title={entry.media.title}
              artworkUrl={mediaArtworkUrl(entry.media)}
              onClick={() => dispatch(prevTrack({ skip: history.length - idx - 1 }))}
            />
          ))}
        </QueueSection>
      )}

      {playingTrack && (
        <QueueSection
          title={currentSourceTitle}
          action={onClear ? <Button onClick={onClear}>Clear</Button> : undefined}
        >
          <QueueRow
            active
            track={playingTrack}
            title={playingTrack.title}
            artworkUrl={mediaArtworkUrl(playingTrack)}
          />
        </QueueSection>
      )}

      {playingTrack && isVideo(playingTrack) && playingTrack.chapters?.length > 0 && (
        <QueueSection title="In this video">
          {playingTrack.chapters.map((chapter, index) => (
            <QueueRow
              key={`chapter_${chapter.time}`}
              track={playingTrack}
              active={index === currentChapterIdx}
              title={chapter.title}
              secondary={chapter.subTitle.trim() || null}
              artworkUrl={mediaArtworkUrl(playingTrack)}
              onClick={() => {
                const nextChapterTime =
                  playingTrack.chapters[index + 1]?.time ?? playingTrack.duration;
                dispatch(
                  setCurrentChapter({
                    chapterIdx: index,
                    duration: nextChapterTime - chapter.time
                  })
                );
                dispatch(videoOnSeek({ position: chapter.time }));
              }}
            />
          ))}
        </QueueSection>
      )}

      {queue.length > 0 && (
        <QueueSection title={nextSourceTitle}>
          {queue.map((entry, idx) => (
            <QueueRow
              key={entry.queueEntryId}
              track={entry.media}
              title={entry.media.title}
              artworkUrl={mediaArtworkUrl(entry.media)}
              onClick={() => dispatch(nextTrack({ skip: idx }))}
              action={
                <IconButton
                  aria-label={`Remove ${entry.media.title} from queue`}
                  onClick={(event) => {
                    event.stopPropagation();
                    dispatch(deleteTrack({ queueEntryId: entry.queueEntryId }));
                  }}
                >
                  <CloseIcon />
                </IconButton>
              }
            />
          ))}
        </QueueSection>
      )}
    </Box>
  );
};

function QueueSection({
  title,
  action,
  children
}: React.PropsWithChildren<{ title: string; action?: React.ReactNode }>) {
  return (
    <Box component="section" sx={{ mt: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", px: 1, mb: 0.75 }}>
        <Typography sx={{ flex: 1, fontSize: 16, fontWeight: 700 }}>{title}</Typography>
        {action}
      </Box>
      <List disablePadding>{children}</List>
    </Box>
  );
}

interface QueueRowProps {
  track: Song | Video;
  title: string;
  artworkUrl?: string;
  active?: boolean;
  action?: React.ReactNode;
  onClick?: () => void;
  secondary?: React.ReactNode | null;
}

function QueueRow({ track, title, artworkUrl, active, action, onClick, secondary }: QueueRowProps) {
  const [actionsAnchor, setActionsAnchor] = React.useState<HTMLElement | null>(null);
  const rowSecondary =
    secondary === undefined ? (
      <ArtistLinks artists={track.artist} color="text.secondary" fontSize={14} />
    ) : (
      secondary
    );

  return (
    <>
      <ListItem disablePadding secondaryAction={action}>
        <ListItemButton
          onClick={onClick}
          selected={active}
          aria-current={active ? "true" : undefined}
          sx={{
            borderRadius: 2,
            px: 1,
            py: 0.75,
            "&.Mui-selected": { bgcolor: NOW_PLAYING_BACKGROUND }
          }}
        >
          <ListItemAvatar sx={{ minWidth: isVideo(track) ? 106 : 66 }}>
            <Box
              sx={{
                height: 52,
                width: isVideo(track) ? "auto" : 52,
                aspectRatio: isVideo(track) ? "16/9" : "1/1",
                borderRadius: "6px",
                overflow: "hidden",
                bgcolor: "rgba(255,255,255,.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "& img": { height: "100%", width: "auto", display: "block" }
              }}
            >
              {artworkUrl ? (
                <Box component="img" src={artworkUrl} alt="" />
              ) : active ? (
                <VolumeUpIcon />
              ) : (
                <MusicNoteIcon />
              )}
            </Box>
          </ListItemAvatar>
          <ListItemText
            primary={title}
            secondary={rowSecondary || undefined}
            primaryTypographyProps={{
              noWrap: true,
              fontSize: 15,
              fontWeight: 600,
              color: active ? NOW_PLAYING_COLOR : "#fff"
            }}
            secondaryTypographyProps={{ noWrap: true, fontSize: 14 }}
          />
          {!action && (
            <IconButton
              aria-label={`${title} actions`}
              onClick={(event) => {
                event.stopPropagation();
                setActionsAnchor(event.currentTarget);
              }}
            >
              <MoreHorizIcon sx={{ color: "text.secondary", fontSize: 20 }} />
            </IconButton>
          )}
        </ListItemButton>
      </ListItem>
      <SongActionsMenu
        track={track}
        open={Boolean(actionsAnchor)}
        anchorEl={actionsAnchor}
        onClose={() => setActionsAnchor(null)}
      />
    </>
  );
}

function queueSourceTitle(prefix: "Playing from" | "Next up from", source?: PlaySource): string {
  if (source?.type === "album" || source?.type === "playlist") {
    return `${prefix} ${source.label}`;
  }

  return `${prefix} mix`;
}

function SuggestedTracks() {
  return (
    <Box sx={{ py: 7, textAlign: "center", color: "text.secondary" }}>
      Suggested tracks will appear here.
    </Box>
  );
}

const queueTabStyles = (active: boolean) => ({
  minHeight: 48,
  px: 2.5,
  borderRadius: "999px",
  color: active ? "#111" : "#fff",
  bgcolor: active ? "rgba(255,255,255,.82)" : "rgba(255,255,255,.08)",
  "&:hover": {
    bgcolor: active ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.12)"
  }
});

export default FloatingQueueList;
