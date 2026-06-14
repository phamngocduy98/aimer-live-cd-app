import React, { useMemo, useState } from "react";
import { Grid } from "@mui/material";
import { AlbumCard } from "@components/media/AlbumCard";
import { CollectionHeader } from "@components/view/CollectionHeader";
import { PageScaffold } from "@components/view/PageScaffold";
import { CollectionContent, PageState } from "@components/view/designSystem";
import { useAlbums } from "../hooks/useLibrary";
import { usePlayAlbum } from "@features/album";

export const Albums: React.FC = () => {
  const { data: albums = [] } = useAlbums();
  const playAlbum = usePlayAlbum();
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

      <CollectionContent>
        <Grid container spacing={2.5}>
          {visibleAlbums.map((album) => (
            <Grid key={album._id} item xs={6} sm={4} md={3} lg={2}>
              <AlbumCard album={album} onPlay={playAlbum} />
            </Grid>
          ))}
          {visibleAlbums.length === 0 && (
            <Grid item xs={12}>
              <PageState state="empty" message={`No albums match “${filter}”`} />
            </Grid>
          )}
        </Grid>
      </CollectionContent>
    </PageScaffold>
  );
};
