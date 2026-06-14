import React from "react";
import { useSearchParams } from "react-router-dom";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";

import Typography from "@mui/material/Typography";

import { AlbumCard } from "@components/media/AlbumCard";
import { SongTable } from "@components/media/SongTable";
import { VideoCard } from "@components/media/VideoCard";
import { SectionHeader } from "@components/view/SectionHeader";
import { PageScaffold } from "@components/view/PageScaffold";
import { useAppDispatch } from "@app/hooks";
import { playContext } from "@features/player/store/playerSlice";
import { useSearch } from "../hooks/useSearch";
import { usePlayAlbum } from "@features/album";

export const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const playAlbum = usePlayAlbum();
  const q = searchParams.get("q") ?? "";
  const { data: result, isLoading: loading } = useSearch(q);
  const playSource = {
    type: "search" as const,
    id: q,
    label: `Search: ${q}`,
    route: `/search?q=${encodeURIComponent(q)}`
  };

  return (
    <PageScaffold background="linear-gradient(180deg, #171b1b 0%, #000 430px)">
      <Box
        sx={{
          width: "100%",
          maxWidth: 1440,
          mx: "auto",
          px: { xs: 2.5, sm: 4, lg: 6 },
          pt: { xs: 7, sm: 9 },
          pb: 3
        }}
      >
        <Typography
          component="h1"
          sx={{ fontSize: { xs: 36, sm: 48 }, fontWeight: 900, letterSpacing: "-.035em" }}
        >
          Search results
        </Typography>
        {q && (
          <Typography component="div" fontSize={16} color="text.secondary" sx={{ mt: 0.75 }}>
            Results for &ldquo;{q}&rdquo;
          </Typography>
        )}
      </Box>

      {loading && (
        <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2.5, sm: 4, lg: 6 } }}>
          <Typography color="text.secondary">Searching...</Typography>
        </Box>
      )}

      {!loading &&
        result &&
        q &&
        !result.songs.length &&
        !result.albums.length &&
        !result.videos.length && (
          <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 2.5, sm: 4, lg: 6 } }}>
            <Typography color="text.secondary">No results found</Typography>
          </Box>
        )}

      {!loading && result && result.songs.length > 0 && (
        <ResultSection title="Songs" count={result.songs.length}>
          <SongTable
            songs={result.songs}
            ariaLabel="search songs table"
            playSource={playSource}
            onPlayFromIndex={(idx) =>
              dispatch(playContext({ items: result.songs, playFrom: playSource, startIndex: idx }))
            }
          />
        </ResultSection>
      )}

      {!loading && result && result.albums.length > 0 && (
        <ResultSection title="Albums" count={result.albums.length}>
          <Grid container spacing={2.5}>
            {result.albums.map((album) => (
              <Grid key={album._id} item xs={6} sm={4} md={3} lg={2}>
                <AlbumCard album={album} onPlay={playAlbum} />
              </Grid>
            ))}
          </Grid>
        </ResultSection>
      )}

      {!loading && result && result.videos.length > 0 && (
        <ResultSection title="Videos" count={result.videos.length}>
          <Grid container spacing={2.5}>
            {result.videos.map((video, idx) => (
              <Grid key={video._id} item xs={6} sm={4} md={3} lg={2}>
                <VideoCard
                  video={video}
                  onPlay={() =>
                    dispatch(
                      playContext({ items: result.videos, playFrom: playSource, startIndex: idx })
                    )
                  }
                />
              </Grid>
            ))}
          </Grid>
        </ResultSection>
      )}
    </PageScaffold>
  );
};

function ResultSection({
  title,
  count,
  children
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 1, sm: 4, lg: 6 }, mb: 5 }}>
      <SectionHeader title={title} count={count} sx={{ px: { xs: 1.5, sm: 0 }, mb: 1 }} />
      {children}
    </Box>
  );
}
