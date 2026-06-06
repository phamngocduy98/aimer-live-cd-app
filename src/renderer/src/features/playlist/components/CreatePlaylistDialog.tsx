import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField
} from "@mui/material";
import { useCreatePlaylist } from "../hooks/usePlaylists";

interface CreatePlaylistDialogProps {
  open: boolean;
  onClose: () => void;
}

export const CreatePlaylistDialog: React.FC<CreatePlaylistDialogProps> = ({ open, onClose }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createPlaylist = useCreatePlaylist();

  const handleSubmit = () => {
    if (!name.trim()) return;
    createPlaylist.mutate(
      { name: name.trim(), description: description.trim() },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          onClose();
        }
      }
    );
  };

  const handleClose = () => {
    if (createPlaylist.isPending) return;
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
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
        <Button onClick={handleClose} disabled={createPlaylist.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!name.trim() || createPlaylist.isPending}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};
