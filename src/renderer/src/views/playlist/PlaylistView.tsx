import React, { useEffect, useState } from "react";
import { PlaylistDetail } from "../../core/Playlist";
import { appAPI } from "../../core/api";
import { useNavigate, useParams } from "react-router-dom";
import { Song } from "../../core/Song";

import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import QueueMusicIcon from "@mui/icons-material/QueueMusic";

import { reset } from "../../store/player/playerSlice";
import { useAppDispatch } from "../../store/hook";
import { usePlaylistRefresh } from "../../contexts/PlaylistRefreshContext";
import { SongTable } from "../../components/media/SongTable";
import { MediaHero } from "../../components/view/MediaHero";
import { PageScaffold } from "../../components/view/PageScaffold";
import { PlayShuffleActions } from "../../components/view/PlayShuffleActions";

export const PlaylistView: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [contextSong, setContextSong] = useState<Song | null>(null);
  const { triggerRefresh } = usePlaylistRefresh();
  let { id } = useParams();

  useEffect(() => {
    if (id == null) return;
    appAPI.getPlaylist(id).then(setPlaylist);
  }, [id]);

  const handleDelete = async () => {
    if (id == null || !playlist) return;
    await appAPI.deletePlaylist(id);
    triggerRefresh();
    navigate("/playlists");
  };

  const handleRemoveSong = async (songId: string) => {
    if (id == null) return;
    await appAPI.removeSongFromPlaylist(id, songId);
    setPlaylist((prev) =>
      prev ? { ...prev, songs: prev.songs.filter((s) => s._id !== songId) } : prev
    );
    setAnchorEl(null);
  };

  if (playlist == null) return null;

  return (
    <PageScaffold background="linear-gradient(180deg, #171717 0%, #000 430px)">
      <MediaHero
        eyebrow="Playlist"
        title={playlist.name}
        description={playlist.description}
        subtitle={`${playlist.songs.length} songs`}
        icon={<QueueMusicIcon />}
        artworkSize={{ xs: 120, sm: 180 }}
      >
        <PlayShuffleActions
          onPlay={() => {
            if (playlist.songs.length === 0) return;
            dispatch(reset({ songs: playlist.songs, type: "audio" }));
          }}
          onShuffle={() => {
            if (playlist.songs.length === 0) return;
            dispatch(reset({ songs: playlist.songs, shuffle: true, type: "audio" }));
          }}
        />
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={handleDelete}
          sx={{ mt: 1.5, textTransform: "none", borderRadius: "999px", px: 2, alignSelf: "flex-start" }}
        >
          Delete
        </Button>
      </MediaHero>

      <SongTable
        songs={playlist.songs}
        ariaLabel="playlist songs table"
        showActions
        onPlayFromIndex={(idx) =>
          dispatch(
            reset({
              songs: playlist.songs.slice(idx),
              history: playlist.songs.slice(0, idx),
              type: "audio"
            })
          )
        }
        onActionClick={(event, song) => {
          setAnchorEl(event.currentTarget);
          setContextSong(song);
        }}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            if (contextSong) handleRemoveSong(contextSong._id);
          }}
        >
          Remove from playlist
        </MenuItem>
      </Menu>
    </PageScaffold>
  );
};
