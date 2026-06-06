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
  Typography
} from "@mui/material";
import { useAddSongsToPlaylist, usePlaylists } from "../hooks/usePlaylists";

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
  const { data: playlists = [], isLoading } = usePlaylists();
  const addSongs = useAddSongsToPlaylist();

  const handleAdd = (playlistId: string) => {
    addSongs.mutate({ playlistId, songIds }, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add to Playlist</DialogTitle>
      <DialogContent sx={{ minHeight: 120 }}>
        {isLoading ? (
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
