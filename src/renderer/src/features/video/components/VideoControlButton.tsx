import { useState } from "react";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import IosShareOutlinedIcon from "@mui/icons-material/IosShareOutlined";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import { Box, Menu, Snackbar, Typography } from "@mui/material";
import { useAppDispatch } from "@app/hooks";
import { SongActionsMenu } from "@components/media/MediaActionsMenu";
import {
  DetailActionButton,
  DetailActions,
  PrimaryActionGroup
} from "@components/view/designSystem";
import type { Video } from "@features/library";
import { playVideoChapter } from "@features/player/thunks/playVideoChapter";
import { AddToPlaylistDialog } from "@features/playlist";

export function VideoControlButton({ video }: { video: Video }): React.ReactElement {
  const dispatch = useAppDispatch();
  const [addToPlaylistOpen, setAddToPlaylistOpen] = useState(false);
  const [creditsAnchor, setCreditsAnchor] = useState<HTMLElement | null>(null);
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);
  const [message, setMessage] = useState("");
  const playSource = {
    type: "video" as const,
    id: video._id,
    label: video.title,
    route: `/video/${video._id}`
  };

  const copyVideoLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage("Video link copied");
    } catch {
      setMessage("Unable to copy video link");
    }
  };

  const shareVideo = async (): Promise<void> => {
    if (navigator.share) {
      try {
        await navigator.share({ title: video.title, url: window.location.href });
        return;
      } catch {
        return;
      }
    }
    await copyVideoLink();
  };

  return (
    <>
      <DetailActions
        primary={
          <PrimaryActionGroup
            onPlay={() => dispatch(playVideoChapter(video, playSource, 0))}
            showShuffle={false}
            playAriaLabel="Play"
          />
        }
        secondary={
          <>
            <DetailActionButton
              label="Add"
              icon={<FavoriteBorderRoundedIcon />}
              onClick={() => setAddToPlaylistOpen(true)}
            />
            <DetailActionButton
              label="Credits"
              icon={<InfoOutlinedIcon />}
              onClick={(event) => setCreditsAnchor(event.currentTarget)}
            />
            <DetailActionButton
              label="Share"
              icon={<IosShareOutlinedIcon />}
              onClick={shareVideo}
            />
            <DetailActionButton
              label="More"
              icon={<MoreHorizRoundedIcon />}
              onClick={(event) => setMoreAnchor(event.currentTarget)}
            />
          </>
        }
      />

      <Menu
        anchorEl={creditsAnchor}
        open={Boolean(creditsAnchor)}
        onClose={() => setCreditsAnchor(null)}
      >
        <Box sx={{ px: 2, py: 1.25, minWidth: 240 }}>
          <Typography fontWeight={850}>{video.title}</Typography>
          <Typography color="text.secondary" fontSize={13} sx={{ mt: 0.75 }}>
            Artist: {video.artist.join(", ")}
          </Typography>
          {video.year && (
            <Typography color="text.secondary" fontSize={13}>
              Release year: {video.year}
            </Typography>
          )}
          {video.genre && video.genre.length > 0 && (
            <Typography color="text.secondary" fontSize={13}>
              Genre: {video.genre.join(", ")}
            </Typography>
          )}
        </Box>
      </Menu>

      <SongActionsMenu
        track={video}
        anchorEl={moreAnchor}
        open={Boolean(moreAnchor)}
        onClose={() => setMoreAnchor(null)}
      />
      <AddToPlaylistDialog
        open={addToPlaylistOpen}
        onClose={() => setAddToPlaylistOpen(false)}
        items={[{ mediaType: "video", mediaId: video._id }]}
      />
      <Snackbar
        open={Boolean(message)}
        autoHideDuration={2200}
        onClose={() => setMessage("")}
        message={message}
      />
    </>
  );
}
