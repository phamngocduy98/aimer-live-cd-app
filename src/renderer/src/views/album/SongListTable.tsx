import { Fragment, useState } from "react";
import { Menu, MenuItem } from "@mui/material";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";

import { reset } from "../../store/player/playerSlice";
import { AlbumDetail } from "../../api/Album";
import { Song } from "../../api/Song";
import { useAppDispatch } from "../../store/hook";
import { AddToPlaylistDialog } from "../../components/dialogs/AddToPlaylistDialog";
import { SongTable } from "../../components/media/SongTable";

export const SongListTable: React.FC<{ album: AlbumDetail }> = ({ album }) => {
  const dispatch = useAppDispatch();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [contextSong, setContextSong] = useState<Song | null>(null);
  const [addToPlaylistOpen, setAddToPlaylistOpen] = useState(false);

  return (
    <Fragment>
      <SongTable
        songs={album.trackList}
        ariaLabel="album songs table"
        getIndexLabel={(track) => track.trackNo}
        showAlbum={false}
        showQuality={false}
        showActions
        onPlayFromIndex={(idx) =>
          dispatch(
            reset({
              songs: album.trackList.slice(idx),
              history: album.trackList.slice(0, idx),
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
            setAnchorEl(null);
            setAddToPlaylistOpen(true);
          }}
        >
          <PlaylistAddIcon sx={{ mr: 1, fontSize: 20 }} />
          Add to Playlist
        </MenuItem>
      </Menu>

      <AddToPlaylistDialog
        open={addToPlaylistOpen}
        onClose={() => {
          setAddToPlaylistOpen(false);
          setContextSong(null);
        }}
        songIds={contextSong ? [contextSong._id] : []}
      />
    </Fragment>
  );
};
