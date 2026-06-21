import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography
} from "@mui/material";
import { useAppSelector } from "@app/hooks";
import { useAddItemsToPlaylist, useCreatePlaylist } from "../hooks/usePlaylists";
import type { PlaylistItemInput } from "../types";

interface CreatePlaylistDialogProps {
  open: boolean;
  onClose: () => void;
  songIds?: string[];
  items?: PlaylistItemInput[];
}

export const CreatePlaylistDialog: React.FC<CreatePlaylistDialogProps> = ({
  open,
  onClose,
  songIds = [],
  items
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const isLoggedIn = useAppSelector((state) => Boolean(state.auth.session.user));
  const createPlaylist = useCreatePlaylist();
  const addItems = useAddItemsToPlaylist();
  const isPending = createPlaylist.isPending || addItems.isPending;
  const playlistItems =
    items ?? songIds.map((mediaId) => ({ mediaType: "audio" as const, mediaId }));

  const finish = (): void => {
    setName("");
    setDescription("");
    onClose();
  };

  const handleSubmit = (): void => {
    if (!isLoggedIn || !name.trim()) return;
    createPlaylist.mutate(
      { name: name.trim(), description: description.trim() },
      {
        onSuccess: (playlistId) => {
          if (playlistItems.length === 0) {
            finish();
            return;
          }
          addItems.mutate(
            { playlistId, items: playlistItems, allowDuplicates: true },
            { onSuccess: finish }
          );
        }
      }
    );
  };

  const handleClose = (): void => {
    if (isPending) return;
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth sx={{ zIndex: 1800 }}>
      <DialogTitle>Create Playlist</DialogTitle>
      <DialogContent>
        {!isLoggedIn ? (
          <Typography color="text.secondary">Log in to create and manage your playlists.</Typography>
        ) : (
          <>
            <TextField
              autoFocus
              margin="dense"
              label="Playlist name"
              fullWidth
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              margin="dense"
              label="Description (optional)"
              fullWidth
              multiline
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isLoggedIn || !name.trim() || isPending}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};
