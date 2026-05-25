import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField
} from "@mui/material";

interface CreatePlaylistDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => Promise<void>;
}

export const CreatePlaylistDialog: React.FC<CreatePlaylistDialogProps> = ({
  open,
  onClose,
  onSubmit
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(name.trim(), description.trim());
      setName("");
      setDescription("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
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
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!name.trim() || submitting}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};
