import React, { useMemo, useState } from "react";
import { Box } from "@mui/material";
import { reset } from "@features/player/store/playerSlice";
import { useAppDispatch } from "@app/hooks";
import { SongTable } from "@components/media/SongTable";
import { CollectionHeader } from "@components/view/CollectionHeader";
import { PageScaffold } from "@components/view/PageScaffold";
import { formatArtists } from "@utils/artist";
import { useSongs } from "../hooks/useLibrary";

export const Songs: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: songs = [] } = useSongs();
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

      <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2.5, sm: 4, lg: 6 }, pb: 3 }}>
        <SongTable
          songs={visibleSongs}
          ariaLabel="songs table"
          showQuality={false}
          showActions
          showAddToPlaylist
          onPlayFromIndex={(idx) =>
            dispatch(
              reset({
                songs: visibleSongs.slice(idx),
                history: visibleSongs.slice(0, idx),
                type: "audio"
              })
            )
          }
        />
      </Box>
    </PageScaffold>
  );
};
