import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField
} from "@mui/material";
import type { PlaylistDetail } from "../types";
import { useUpdatePlaylist } from "../hooks/usePlaylists";

interface EditPlaylistDialogProps {
  open: boolean;
  playlist: PlaylistDetail;
  onClose: () => void;
}

export const EditPlaylistDialog: React.FC<EditPlaylistDialogProps> = ({
  open,
  playlist,
  onClose
}) => {
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description ?? "");
  const updatePlaylist = useUpdatePlaylist();

  useEffect(() => {
    if (!open) return;
    setName(playlist.name);
    setDescription(playlist.description ?? "");
  }, [open, playlist.description, playlist.name]);

  const handleClose = (): void => {
    if (!updatePlaylist.isPending) onClose();
  };

  const handleSubmit = (): void => {
    const nextName = name.trim();
    if (!nextName) return;

    updatePlaylist.mutate(
      {
        id: playlist._id,
        data: { name: nextName, description: description.trim() }
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Playlist</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Playlist name"
          fullWidth
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <TextField
          margin="dense"
          label="Description (optional)"
          fullWidth
          multiline
          rows={2}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={updatePlaylist.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!name.trim() || updatePlaylist.isPending}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
