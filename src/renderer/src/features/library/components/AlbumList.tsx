import React, { useMemo, useState } from "react";
import { Grid, Typography } from "@mui/material";
import { AlbumCard } from "@components/media/AlbumCard";
import { CollectionHeader } from "@components/view/CollectionHeader";
import { PageScaffold } from "@components/view/PageScaffold";
import { useAlbums } from "../hooks/useLibrary";

export const Albums: React.FC = () => {
  const { data: albums = [] } = useAlbums();
  const [filter, setFilter] = useState("");

  const visibleAlbums = useMemo(() => {
    const query = filter.trim().toLocaleLowerCase();
    if (!query) return albums;

    return albums.filter((album) =>
      [album.title, album.artist, album.year?.toString()]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase().includes(query))
    );
  }, [albums, filter]);

  return (
    <PageScaffold>
      <CollectionHeader
        title="Albums"
        filterLabel="Filter albums"
        filterValue={filter}
        onFilterChange={setFilter}
        actions={[{ label: `${albums.length} albums`, disabled: true }]}
      />

      <Grid
        container
        spacing={2.5}
        sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2.5, sm: 4, lg: 6 }, pb: 3 }}
      >
        {visibleAlbums.map((album) => (
          <Grid key={album._id} item xs={6} sm={4} md={3} lg={2}>
            <AlbumCard album={album} />
          </Grid>
        ))}
        {visibleAlbums.length === 0 && (
          <Grid item xs={12}>
            <Typography color="text.secondary" sx={{ py: 5, textAlign: "center" }}>
              No albums match &ldquo;{filter}&rdquo;
            </Typography>
          </Grid>
        )}
      </Grid>
    </PageScaffold>
  );
};
