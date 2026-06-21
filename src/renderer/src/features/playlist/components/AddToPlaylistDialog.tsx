import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  DialogContentText
} from "@mui/material";
import { useAppSelector } from "@app/hooks";
import { useAddItemsToPlaylist, usePlaylists } from "../hooks/usePlaylists";
import type { PlaylistItemInput } from "../types";

interface AddToPlaylistDialogProps {
  open: boolean;
  onClose: () => void;
  songIds?: string[];
  items?: PlaylistItemInput[];
}

export const AddToPlaylistDialog: React.FC<AddToPlaylistDialogProps> = ({
  open,
  onClose,
  songIds = [],
  items
}) => {
  const { data: playlists = [], isLoading } = usePlaylists();
  const isLoggedIn = useAppSelector((state) => Boolean(state.auth.session.user));
  const addItems = useAddItemsToPlaylist();
  const [duplicatePlaylistId, setDuplicatePlaylistId] = React.useState<string | null>(null);
  const mediaItems = items ?? songIds.map((mediaId) => ({ mediaType: "audio" as const, mediaId }));

  const handleAdd = (playlistId: string, allowDuplicates = false) => {
    if (!isLoggedIn) return;
    addItems.mutate(
      { playlistId, items: mediaItems, allowDuplicates },
      {
        onSuccess: onClose,
        onError: (error: any) => {
          if (error?.response?.status === 409) setDuplicatePlaylistId(playlistId);
        }
      }
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add to Playlist</DialogTitle>
      <DialogContent sx={{ minHeight: 120 }}>
        {!isLoggedIn ? (
          <Typography color="text.secondary">Log in to manage your playlists.</Typography>
        ) : isLoading ? (
          <Typography color="text.secondary">Loading playlists...</Typography>
        ) : playlists.length === 0 ? (
          <Typography color="text.secondary">No playlists yet. Create one first.</Typography>
        ) : (
          <List dense>
            {playlists.map((pl) => (
              <ListItemButton key={pl._id} onClick={() => handleAdd(pl._id)}>
                <ListItemText primary={pl.name} secondary={`${pl.itemCount} items`} />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
      <Dialog open={Boolean(duplicatePlaylistId)} onClose={() => setDuplicatePlaylistId(null)}>
        <DialogTitle>Add duplicate items?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            One or more selected items already exist in this playlist. Add another occurrence?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicatePlaylistId(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (duplicatePlaylistId) handleAdd(duplicatePlaylistId, true);
              setDuplicatePlaylistId(null);
            }}
          >
            Add duplicates
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};
