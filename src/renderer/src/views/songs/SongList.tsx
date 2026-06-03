import React, { useEffect, useState } from "react";
import { Song } from "../../api/Song";
import { AppAPI, appAPI } from "../../api/api";

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import MusicNoteIcon from "@mui/icons-material/MusicNote";

import { reset } from "../../store/player/playerSlice";
import { useAppDispatch } from "../../store/hook";
import { AddToPlaylistDialog } from "../../components/dialogs/AddToPlaylistDialog";
import { SongTable } from "../../components/media/SongTable";
import { MediaHero } from "../../components/view/MediaHero";
import { PageScaffold } from "../../components/view/PageScaffold";
import { PlayShuffleActions } from "../../components/view/PlayShuffleActions";

export const Songs: React.FC = () => {
  const dispatch = useAppDispatch();
  const [songs, setSongs] = useState<Song[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [contextSong, setContextSong] = useState<Song | null>(null);
  const [addToPlaylistOpen, setAddToPlaylistOpen] = useState(false);

  useEffect(() => {
    appAPI.listSongs().then(setSongs);
  }, []);

  const onPlayAll = () => {
    if (songs.length === 0) return;
    dispatch(reset({ songs, type: "audio" }));
  };

  const onPlayShuffleAll = () => {
    if (songs.length === 0) return;
    dispatch(reset({ songs, shuffle: true, type: "audio" }));
  };

  return (
    <PageScaffold
      backgroundImage={
        songs[0]?.album?._id
          ? `linear-gradient(180deg, rgba(0,0,0,.24) 0%, #000 430px), linear-gradient(90deg, rgba(0,0,0,.9), rgba(0,0,0,.48)), url("${AppAPI.HOST}/album/${songs[0].album._id}/cover")`
          : "linear-gradient(180deg, #151515 0%, #000 430px)"
      }
    >
      <MediaHero
        eyebrow="Collection"
        title="Songs"
        subtitle={`${songs.length} tracks`}
        icon={<MusicNoteIcon />}
      >
        <PlayShuffleActions onPlay={onPlayAll} onShuffle={onPlayShuffleAll} />
      </MediaHero>

      <SongTable
        songs={songs}
        ariaLabel="songs table"
        showActions
        onPlayFromIndex={(idx) =>
          dispatch(reset({ songs: songs.slice(idx), history: songs.slice(0, idx), type: "audio" }))
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
    </PageScaffold>
  );
};
