import React from "react";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogContent,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import type { Album, Song, Video } from "@features/library";
import { isVideo } from "@features/library";
import { AddToPlaylistDialog } from "@features/playlist";
import { apiAssetUrl } from "@lib/axios";
import { router } from "@app/router";
import { artistPath, getPrimaryArtist } from "@utils/artist";

export interface ActionMenuPosition {
  top: number;
  left: number;
}

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
        track.album?._id
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
        cover={track?.album?._id}
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
      cover={album?._id}
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
  cover,
  actions
}: {
  open: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
  anchorPosition?: ActionMenuPosition | null;
  title: string;
  subtitle: string;
  cover?: string;
  actions: ExtraMediaAction[];
}) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("sm"));
  const titleId = "media-actions-title";
  const header = <ActionHeader title={title} subtitle={subtitle} cover={cover} titleId={titleId} />;

  if (mobile) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        aria-labelledby={titleId}
        sx={{ zIndex: 1700 }}
        PaperProps={{
          sx: {
            m: 1.5,
            width: "calc(100% - 24px)",
            maxWidth: 520,
            borderRadius: "22px",
            bgcolor: "#292929",
            backgroundImage: "none"
          }
        }}
      >
        <DialogContent sx={{ p: 2.5 }}>
          {header}
          <List disablePadding sx={{ mt: 1.5 }}>
            {actions.map((action) => (
              <ListItemButton
                key={action.label}
                onClick={action.onClick ?? onClose}
                sx={{ minHeight: 52, borderRadius: 1.5, px: 1.5 }}
              >
                <ListItemText
                  primary={action.label}
                  primaryTypographyProps={{ fontSize: 17, fontWeight: 750 }}
                />
              </ListItemButton>
            ))}
          </List>
          <Button
            fullWidth
            onClick={onClose}
            sx={{ mt: 2, minHeight: 54, borderRadius: 2, bgcolor: "rgba(255,255,255,.12)" }}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Menu
      open={open}
      onClose={onClose}
      sx={{ zIndex: 1800 }}
      anchorEl={anchorEl}
      anchorReference={anchorPosition ? "anchorPosition" : "anchorEl"}
      anchorPosition={anchorPosition ?? undefined}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{ paper: { sx: { width: 286, p: 1, borderRadius: 2 } } }}
    >
      <Box sx={{ px: 1.25, pt: 0.75, pb: 1 }}>{header}</Box>
      {actions.map((action) => (
        <MenuItem
          key={action.label}
          onClick={action.onClick ?? onClose}
          sx={{ minHeight: 44, borderRadius: 1, fontWeight: 650 }}
        >
          {action.label}
        </MenuItem>
      ))}
    </Menu>
  );
}

function ActionHeader({
  title,
  subtitle,
  cover,
  titleId
}: {
  title: string;
  subtitle: string;
  cover?: string;
  titleId?: string;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Avatar
        variant="rounded"
        src={cover ? apiAssetUrl(`/album/${cover}/cover`) : undefined}
        sx={{ width: 48, height: 48 }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography id={titleId} noWrap fontWeight={800}>
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
