import React, { useMemo, useState } from "react";
import type { Song } from "../types";

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import { reset } from "@features/player/store/playerSlice";
import { useAppDispatch } from "@app/hooks";
import { AddToPlaylistDialog } from "@features/playlist";
import { SongTable } from "@components/media/SongTable";
import { CollectionHeader } from "@components/view/CollectionHeader";
import { PageScaffold } from "@components/view/PageScaffold";
import { formatArtists } from "@utils/artist";
import { useSongs } from "../hooks/useLibrary";

export const Songs: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: songs = [] } = useSongs();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [contextSong, setContextSong] = useState<Song | null>(null);
  const [addToPlaylistOpen, setAddToPlaylistOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const visibleSongs = useMemo(() => {
    const query = filter.trim().toLocaleLowerCase();
    if (!query) return songs;

    return songs.filter((song) =>
      [song.title, formatArtists(song.artist), song.album?.title]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase().includes(query))
    );
  }, [filter, songs]);

  const onPlayAll = () => {
    if (songs.length === 0) return;
    dispatch(reset({ songs, type: "audio" }));
  };

  const onPlayShuffleAll = () => {
    if (songs.length === 0) return;
    dispatch(reset({ songs, shuffle: true, type: "audio" }));
  };

  return (
    <PageScaffold>
      <CollectionHeader
        title="Songs"
        filterLabel="Filter songs"
        filterValue={filter}
        onFilterChange={setFilter}
        actions={[
          { label: "Play all", onClick: onPlayAll },
          { label: "Shuffle all", onClick: onPlayShuffleAll },
          { label: `${songs.length} songs`, disabled: true }
        ]}
      />

      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        <SongTable
          songs={visibleSongs}
          ariaLabel="songs table"
          showActions
          onPlayFromIndex={(idx) =>
            dispatch(
              reset({
                songs: visibleSongs.slice(idx),
                history: visibleSongs.slice(0, idx),
                type: "audio"
              })
            )
          }
          onActionClick={(event, song) => {
            setAnchorEl(event.currentTarget);
            setContextSong(song);
          }}
        />
      </div>
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
