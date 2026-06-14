import React, { useMemo, useState } from "react";
import { usePlaylists } from "../hooks/usePlaylists";

import Grid from "@mui/material/Grid";
import { CollectionHeader } from "@components/view/CollectionHeader";
import { PageScaffold } from "@components/view/PageScaffold";
import { PlaylistCard } from "@components/media/PlaylistCard";
import { CollectionContent, PageState } from "@components/view/designSystem";

export const Playlists: React.FC = () => {
  const { data: playlists = [] } = usePlaylists();
  const [filter, setFilter] = useState("");

  const visiblePlaylists = useMemo(() => {
    const query = filter.trim().toLocaleLowerCase();
    if (!query) return playlists;

    return playlists.filter((playlist) =>
      [playlist.name, playlist.description]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase().includes(query))
    );
  }, [filter, playlists]);

  return (
    <PageScaffold>
      <CollectionHeader
        title="Playlists"
        filterLabel="Filter playlists"
        filterValue={filter}
        onFilterChange={setFilter}
        actions={[{ label: `${playlists.length} playlists`, disabled: true }]}
      />

      <CollectionContent>
        {visiblePlaylists.length === 0 ? (
          <PageState
            state="empty"
            message={
              playlists.length === 0
                ? "No playlists yet. Create one from the sidebar."
                : `No playlists match “${filter}”`
            }
          />
        ) : (
          <Grid container spacing={2.5}>
            {visiblePlaylists.map((pl) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={pl._id}>
                <PlaylistCard playlist={pl} />
              </Grid>
            ))}
          </Grid>
        )}
      </CollectionContent>
    </PageScaffold>
  );
};
