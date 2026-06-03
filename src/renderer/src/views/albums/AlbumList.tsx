import React, { useEffect, useState, useMemo } from "react";
import { Album } from "../../api/Album";
import { AppAPI, appAPI } from "../../api/api";
import "./albums.css";

import { Grid } from "@mui/material";
import Typography from "@mui/material/Typography";

import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { AlbumCard } from "../../components/media/AlbumCard";
import { MediaHero } from "../../components/view/MediaHero";
import { PageScaffold } from "../../components/view/PageScaffold";

export const Albums: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  useEffect(() => {
    appAPI.listAlbums().then((al) => setAlbums(al));
  }, []);

  const groupedAlbums = useMemo(() => {
    return albums.reduce(
      (acc, album) => {
        const year = album.year ?? "Unknown";
        if (!acc[year]) acc[year] = [];
        acc[year].push(album);
        return acc;
      },
      {} as Record<string | number, Album[]>
    );
  }, [albums]);

  const sortedYears = useMemo(() => {
    return Object.keys(groupedAlbums).sort((a, b) => {
      if (a === "Unknown") return 1;
      if (b === "Unknown") return -1;
      return Number(b) - Number(a);
    });
  }, [groupedAlbums]);

  return (
    <PageScaffold
      backgroundImage={
        albums.at(-1)
          ? `linear-gradient(180deg, rgba(0,0,0,.34) 0%, #000 420px), url("${AppAPI.HOST}/album/${albums.at(-1)?._id}/cover")`
          : "linear-gradient(180deg, #151515 0%, #000 420px)"
      }
    >
      <MediaHero
        eyebrow="Collection"
        title="Albums"
        subtitle={`${albums.length} albums in your library`}
        icon={<MusicNoteIcon />}
        artworkSize={{ xs: 64, sm: 64 }}
      />
      <Grid container spacing={2.5} sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
        {sortedYears.map((year) => (
          <React.Fragment key={year}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ color: "#fff", mb: 1, fontWeight: 800 }}>
                {year}
              </Typography>
            </Grid>
            {groupedAlbums[year].map((album) => (
              <Grid key={album._id} item xs={6} sm={4} md={3} lg={2}>
                <AlbumCard album={album} />
              </Grid>
            ))}
          </React.Fragment>
        ))}
      </Grid>
    </PageScaffold>
  );
};
