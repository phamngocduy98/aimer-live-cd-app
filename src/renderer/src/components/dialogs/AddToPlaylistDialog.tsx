import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Typography
} from "@mui/material";
import { Playlist } from "../../api/Playlist";
import { appAPI } from "../../api/api";

interface AddToPlaylistDialogProps {
  open: boolean;
  onClose: () => void;
  songIds: string[];
}

export const AddToPlaylistDialog: React.FC<AddToPlaylistDialogProps> = ({
  open,
  onClose,
  songIds
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    appAPI
      .listPlaylists()
      .then(setPlaylists)
      .finally(() => setLoading(false));
  }, [open]);

  const handleAdd = async (playlistId: string) => {
    await appAPI.addSongsToPlaylist(playlistId, songIds);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add to Playlist</DialogTitle>
      <DialogContent sx={{ minHeight: 120 }}>
        {loading ? (
          <Typography color="text.secondary">Loading playlists...</Typography>
        ) : playlists.length === 0 ? (
          <Typography color="text.secondary">No playlists yet. Create one first.</Typography>
        ) : (
          <List dense>
            {playlists.map((pl) => (
              <ListItemButton key={pl._id} onClick={() => handleAdd(pl._id)}>
                <ListItemText primary={pl.name} secondary={`${pl.songCount} songs`} />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};
