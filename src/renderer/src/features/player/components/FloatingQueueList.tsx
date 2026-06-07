import CloseIcon from "@mui/icons-material/Close";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import {
  Avatar,
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
import { apiAssetUrl } from "@lib/axios";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { deleteTrack, nextTrack, prevTrack, reset, setCurrentChapter } from "../store/playerSlice";
import { hideView } from "../store/playerGuiSlice";
import { isVideo } from "@features/library";
import type { Song, Video } from "@features/library";
import { videoOnSeek } from "../store/playerVideoControl";
import { SongActionsMenu } from "@components/media/MediaActionsMenu";
import { CreatePlaylistDialog } from "@features/playlist";

export const FloatingQueueList = () => {
  const { playingQueue, mobilePlayer } = useAppSelector((state) => state.playerGui);
  const dispatch = useAppDispatch();

  if (mobilePlayer) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 78,
        right: 18,
        zIndex: 1400,
        width: 390,
        maxWidth: "calc(100dvw - 36px)",
        transform: `translateX(${playingQueue ? 0 : "calc(100% + 36px)"})`,
        transition: "transform 280ms ease"
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
  const songIds = React.useMemo(
    () =>
      [playingTrack, ...queue]
        .filter((track): track is Song => Boolean(track && !isVideo(track)))
        .map((track) => track._id),
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
            <Typography component="h2" sx={{ flex: 1, fontSize: 24, fontWeight: 850 }}>
              Play queue
            </Typography>
            <IconButton
              aria-label="Create playlist from queue"
              size="small"
              disabled={songIds.length === 0}
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
        songIds={songIds}
      />
    </>
  );
}

export const QueueList: React.FC<{ onClear?: () => void }> = ({ onClear }) => {
  const dispatch = useAppDispatch();
  const { playingTrack, history, queue } = useAppSelector((state) => state.player);
  const currentChapterIdx = useAppSelector((state) => state.player.currentChapterIdx);

  return (
    <Box sx={{ pb: 3 }}>
      {history.length > 0 && (
        <QueueSection title="History">
          {history.map((song, idx) => (
            <QueueRow
              key={`history_${song._id}_${idx}`}
              track={song}
              title={song.title}
              artist={song.artist.join(", ")}
              cover={song.album?._id}
              onClick={() => dispatch(prevTrack({ skip: history.length - idx - 1 }))}
            />
          ))}
        </QueueSection>
      )}

      {playingTrack && (
        <QueueSection
          title={isVideo(playingTrack) ? "Videos" : (playingTrack.album?.title ?? "Mix")}
          action={onClear ? <Button onClick={onClear}>Clear</Button> : undefined}
        >
          <QueueRow
            active
            track={playingTrack}
            title={playingTrack.title}
            artist={playingTrack.artist.join(", ")}
            cover={playingTrack.album?._id}
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
              artist={chapter.subTitle}
              cover={playingTrack.album?._id}
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
        <QueueSection title="Next Up from: Mix">
          {queue.map((song, idx) => (
            <QueueRow
              key={`queue_${song._id}_${idx}`}
              track={song}
              title={song.title}
              artist={song.artist.join(", ")}
              cover={song.album?._id}
              onClick={() => dispatch(nextTrack({ skip: idx }))}
              action={
                <IconButton
                  aria-label={`Remove ${song.title} from queue`}
                  onClick={(event) => {
                    event.stopPropagation();
                    dispatch(deleteTrack({ songId: song._id }));
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
        <Typography sx={{ flex: 1, fontSize: 16, fontWeight: 800 }}>{title}</Typography>
        {action}
      </Box>
      <List disablePadding>{children}</List>
    </Box>
  );
}

interface QueueRowProps {
  track: Song | Video;
  title: string;
  artist: string;
  cover?: string;
  active?: boolean;
  action?: React.ReactNode;
  onClick?: () => void;
}

function QueueRow({ track, title, artist, cover, active, action, onClick }: QueueRowProps) {
  const [actionsAnchor, setActionsAnchor] = React.useState<HTMLElement | null>(null);
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
            "&.Mui-selected": { bgcolor: "rgba(255,212,42,.12)" }
          }}
        >
          <ListItemAvatar sx={{ minWidth: 66 }}>
            <Avatar
              variant="rounded"
              src={cover ? apiAssetUrl(`/album/${cover}/cover`) : undefined}
              sx={{ width: 56, height: 56, borderRadius: 1.25 }}
            >
              {active ? <VolumeUpIcon /> : <MusicNoteIcon />}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={title}
            secondary={artist}
            primaryTypographyProps={{
              noWrap: true,
              fontSize: 15,
              fontWeight: 750,
              color: active ? "#ffd42a" : "#fff"
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
