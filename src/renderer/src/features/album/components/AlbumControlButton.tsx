import { useState } from "react";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import IosShareOutlinedIcon from "@mui/icons-material/IosShareOutlined";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import { Box, Snackbar, Typography } from "@mui/material";
import { ResponsiveActionMenu } from "@components/common/ResponsiveActionMenu";
import { usePlaybackGate } from "@features/auth";
import { AddToPlaylistDialog } from "@features/playlist";
import type { AlbumDetail } from "../types";
import { AlbumActionsMenu } from "@components/media/MediaActionsMenu";
import {
  DetailActionButton,
  DetailActions,
  PrimaryActionGroup
} from "@components/view/designSystem";

export const AlbumControlButton: React.FC<{ album: AlbumDetail }> = ({ album }) => {
  const playMedia = usePlaybackGate();
  const [addToPlaylistOpen, setAddToPlaylistOpen] = useState(false);
  const [creditsAnchor, setCreditsAnchor] = useState<HTMLElement | null>(null);
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);
  const [message, setMessage] = useState("");

  const playableItems = album.trackList;
  const playSource = {
    type: "album" as const,
    id: album._id,
    label: album.title,
    route: `/album/${album._id}`
  };

  const play = (shuffle = false) => {
    if (playableItems.length === 0) return;
    playMedia({ items: playableItems, playFrom: playSource, shuffle });
  };

  const copyAlbumLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage("Album link copied");
    } catch {
      setMessage("Unable to copy album link");
    }
    setMoreAnchor(null);
  };

  const shareAlbum = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: album.title, url: window.location.href });
        return;
      } catch {
        return;
      }
    }
    await copyAlbumLink();
  };

  return (
    <>
      <DetailActions
        primary={<PrimaryActionGroup onPlay={() => play()} onShuffle={() => play(true)} />}
        secondaryColumns={{ xs: 3, sm: 2, md: 3, lg: 4 }}
        secondary={
          <>
            <DetailActionButton
              label="Add"
              icon={<FavoriteBorderRoundedIcon />}
              onClick={() => setAddToPlaylistOpen(true)}
            />
            <Box sx={{ display: { xs: "none", sm: "none", lg: "block" } }}>
              <DetailActionButton
                label="Credits"
                icon={<InfoOutlinedIcon />}
                onClick={(event) => setCreditsAnchor(event.currentTarget)}
              />
            </Box>
            <Box sx={{ display: { xs: "block", sm: "none", md: "block" } }}>
              <DetailActionButton
                label="Share"
                icon={<IosShareOutlinedIcon />}
                onClick={shareAlbum}
              />
            </Box>
            <DetailActionButton
              label="More"
              icon={<MoreHorizRoundedIcon />}
              onClick={(event) => setMoreAnchor(event.currentTarget)}
            />
          </>
        }
      />

      <ResponsiveActionMenu
        anchorEl={creditsAnchor}
        open={Boolean(creditsAnchor)}
        onClose={() => setCreditsAnchor(null)}
        ariaLabel={`${album.title} credits`}
        mobileContentSx={{ p: 2 }}
      >
        <Box sx={{ px: { xs: 0, sm: 2 }, py: { xs: 0, sm: 1.25 }, minWidth: 240 }}>
          <Typography fontWeight={700}>{album.title}</Typography>
          <Typography color="text.secondary" fontSize={13} sx={{ mt: 0.75 }}>
            Artist: {album.artist}
          </Typography>
          <Typography color="text.secondary" fontSize={13}>
            Release year: {album.year}
          </Typography>
          {album.genre.length > 0 && (
            <Typography color="text.secondary" fontSize={13}>
              Genre: {album.genre.join(", ")}
            </Typography>
          )}
        </Box>
      </ResponsiveActionMenu>

      <AlbumActionsMenu
        album={album}
        anchorEl={moreAnchor}
        open={Boolean(moreAnchor)}
        onClose={() => setMoreAnchor(null)}
        onAddToPlaylist={() => setAddToPlaylistOpen(true)}
      />

      <AddToPlaylistDialog
        open={addToPlaylistOpen}
        onClose={() => setAddToPlaylistOpen(false)}
        songIds={album.trackList.map((song) => song._id)}
      />
      <Snackbar
        open={Boolean(message)}
        autoHideDuration={2200}
        onClose={() => setMessage("")}
        message={message}
      />
    </>
  );
};
