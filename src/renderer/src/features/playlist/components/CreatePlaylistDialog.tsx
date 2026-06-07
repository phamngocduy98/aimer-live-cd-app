import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField
} from "@mui/material";
import { useAddSongsToPlaylist, useCreatePlaylist } from "../hooks/usePlaylists";

interface CreatePlaylistDialogProps {
  open: boolean;
  onClose: () => void;
  songIds?: string[];
}

export const CreatePlaylistDialog: React.FC<CreatePlaylistDialogProps> = ({
  open,
  onClose,
  songIds = []
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createPlaylist = useCreatePlaylist();
  const addSongs = useAddSongsToPlaylist();
  const isPending = createPlaylist.isPending || addSongs.isPending;

  const finish = (): void => {
    setName("");
    setDescription("");
    onClose();
  };

  const handleSubmit = (): void => {
    if (!name.trim()) return;
    createPlaylist.mutate(
      { name: name.trim(), description: description.trim() },
      {
        onSuccess: (playlistId) => {
          if (songIds.length === 0) {
            finish();
            return;
          }
          addSongs.mutate({ playlistId, songIds }, { onSuccess: finish });
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
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!name.trim() || isPending}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};
