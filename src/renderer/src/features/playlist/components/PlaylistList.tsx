import React, { useMemo, useState } from "react";
import { usePlaylists } from "../hooks/usePlaylists";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { CollectionHeader } from "@components/view/CollectionHeader";
import { PageScaffold } from "@components/view/PageScaffold";
import { PlaylistCard } from "@components/media/PlaylistCard";

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

      <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2.5, sm: 4, lg: 6 }, pb: 3 }}>
        {visiblePlaylists.length === 0 ? (
          <Typography color="#a7a7a7" sx={{ mt: 4, textAlign: "center" }}>
            {playlists.length === 0
              ? "No playlists yet. Create one from the sidebar."
              : `No playlists match “${filter}”`}
          </Typography>
        ) : (
          <Grid container spacing={2.5}>
            {visiblePlaylists.map((pl) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={pl._id}>
                <PlaylistCard playlist={pl} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </PageScaffold>
  );
};
