import React, { useMemo, useState } from "react";
import { usePlaybackGate } from "@features/auth";
import { SongTable } from "@components/media/SongTable";
import { CollectionHeader } from "@components/view/CollectionHeader";
import { PageScaffold } from "@components/view/PageScaffold";
import { CollectionContent } from "@components/view/designSystem";
import { formatArtists } from "@utils/artist";
import { useSongs } from "../hooks/useLibrary";

export const Songs: React.FC = () => {
  const play = usePlaybackGate();
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
    play({ items: songs, playFrom: playSource });
  };

  const onPlayShuffleAll = () => {
    if (songs.length === 0) return;
    play({ items: songs, playFrom: playSource, shuffle: true });
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

      <CollectionContent>
        <SongTable
          songs={visibleSongs}
          ariaLabel="songs table"
          showQuality={false}
          showArtwork
          showActions
          showAddToPlaylist
          playSource={playSource}
          onPlayFromIndex={(idx) =>
            play({ items: visibleSongs, playFrom: playSource, startIndex: idx })
          }
        />
      </CollectionContent>
    </PageScaffold>
  );
};
const playSource = { type: "songs" as const, label: "Songs", route: "/songs" };
