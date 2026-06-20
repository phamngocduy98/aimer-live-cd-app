import React from "react";
import { Avatar, Box, Typography } from "@mui/material";
import {
  ResponsiveActionMenu,
  type ActionMenuPosition,
  type ResponsiveActionMenuItem
} from "@components/common/ResponsiveActionMenu";
import type { Album, Song, Video } from "@features/library";
import { isVideo } from "@features/library";
import { AddToPlaylistDialog } from "@features/playlist";
import { apiAssetUrl } from "@lib/axios";
import { router } from "@app/router";
import { artistPath, getPrimaryArtist } from "@utils/artist";
import { mediaArtworkUrl } from "@utils/mediaArtwork";

export type { ActionMenuPosition };

export interface ExtraMediaAction {
  label: string;
  onClick?: () => void;
}

interface SongActionsMenuProps {
  track: Song | Video | null;
  anchorEl?: HTMLElement | null;
  anchorPosition?: ActionMenuPosition | null;
  open: boolean;
  onClose: () => void;
  extraActions?: ExtraMediaAction[];
}

export function SongActionsMenu({
  track,
  anchorEl,
  anchorPosition,
  open,
  onClose,
  extraActions = []
}: SongActionsMenuProps) {
  const [addToPlaylistOpen, setAddToPlaylistOpen] = React.useState(false);
  const actions = track
    ? [
        { label: "Play next" },
        ...extraActions,
        {
          label: "Add to Playlist",
          onClick: () => {
            onClose();
            setAddToPlaylistOpen(true);
          }
        },
        { label: "Add to My Collection" },
        { label: isVideo(track) ? "Go to video radio" : "Go to track radio" },
        !isVideo(track) && track.album?._id
          ? {
              label: "Go to album",
              onClick: () => navigateAndClose(`/album/${track.album?._id}`, onClose)
            }
          : null,
        { label: "Credits" },
        {
          label: "Go to artist",
          onClick: () => navigateAndClose(artistPath(getPrimaryArtist(track.artist)), onClose)
        },
        { label: "Share", onClick: () => shareMedia(track.title, track.artist.join(", "), onClose) }
      ].filter(Boolean)
    : [];

  return (
    <>
      <ResponsiveActionSurface
        open={open}
        onClose={onClose}
        anchorEl={anchorEl}
        anchorPosition={anchorPosition}
        title={track?.title ?? ""}
        subtitle={track?.artist.join(", ") ?? ""}
        artworkUrl={mediaArtworkUrl(track)}
        actions={actions as ExtraMediaAction[]}
      />
      <AddToPlaylistDialog
        open={addToPlaylistOpen}
        onClose={() => setAddToPlaylistOpen(false)}
        items={track ? [{ mediaType: isVideo(track) ? "video" : "audio", mediaId: track._id }] : []}
      />
    </>
  );
}

interface AlbumActionsMenuProps {
  album: Album | null;
  anchorEl?: HTMLElement | null;
  anchorPosition?: ActionMenuPosition | null;
  open: boolean;
  onClose: () => void;
  onAddToPlaylist?: () => void;
}

export function AlbumActionsMenu({
  album,
  anchorEl,
  anchorPosition,
  open,
  onClose,
  onAddToPlaylist
}: AlbumActionsMenuProps) {
  const actions = album
    ? [
        ...(onAddToPlaylist
          ? [
              {
                label: "Add to Playlist",
                onClick: () => {
                  onClose();
                  onAddToPlaylist();
                }
              }
            ]
          : []),
        { label: "Add to My Collection" },
        { label: "Go to album radio" },
        { label: "Credits" },
        {
          label: "Go to artist",
          onClick: () => navigateAndClose(artistPath(album.artist), onClose)
        },
        { label: "Share", onClick: () => shareMedia(album.title, album.artist, onClose) }
      ]
    : [];

  return (
    <ResponsiveActionSurface
      open={open}
      onClose={onClose}
      anchorEl={anchorEl}
      anchorPosition={anchorPosition}
      title={album?.title ?? ""}
      subtitle={album?.artist ?? ""}
      artworkUrl={album?._id ? apiAssetUrl(`/album/${album._id}/cover`) : undefined}
      actions={actions}
    />
  );
}

function ResponsiveActionSurface({
  open,
  onClose,
  anchorEl,
  anchorPosition,
  title,
  subtitle,
  artworkUrl,
  actions
}: {
  open: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
  anchorPosition?: ActionMenuPosition | null;
  title: string;
  subtitle: string;
  artworkUrl?: string;
  actions: ExtraMediaAction[];
}) {
  const titleId = "media-actions-title";
  const header = (
    <ActionHeader title={title} subtitle={subtitle} artworkUrl={artworkUrl} titleId={titleId} />
  );

  return (
    <ResponsiveActionMenu
      open={open}
      onClose={onClose}
      anchorEl={anchorEl}
      anchorPosition={anchorPosition}
      title={title}
      header={header}
      items={actions as ResponsiveActionMenuItem[]}
      showCloseButton
      zIndex={1800}
      desktopPaperSx={{ width: 286, p: 1, borderRadius: 2 }}
    />
  );
}

function ActionHeader({
  title,
  subtitle,
  artworkUrl,
  titleId
}: {
  title: string;
  subtitle: string;
  artworkUrl?: string;
  titleId?: string;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Avatar variant="rounded" src={artworkUrl} sx={{ width: 48, height: 48 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography id={titleId} noWrap fontWeight={700}>
          {title}
        </Typography>
        <Typography noWrap color="text.secondary" fontSize={14}>
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );
}

function navigateAndClose(path: string, onClose: () => void) {
  onClose();
  router.navigate(path);
}

function shareMedia(title: string, subtitle: string, onClose: () => void) {
  void navigator.share?.({ title, text: `${title} - ${subtitle}` });
  onClose();
}
