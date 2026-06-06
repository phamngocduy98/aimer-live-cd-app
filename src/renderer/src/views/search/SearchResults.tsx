import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { appAPI, SearchResult } from "../../api/api";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";

import Typography from "@mui/material/Typography";

import { AlbumCard } from "../../components/media/AlbumCard";
import { SongTable } from "../../components/media/SongTable";
import { VideoCard } from "../../components/media/VideoCard";
import { SectionHeader } from "../../components/view/SectionHeader";
import { useAppDispatch } from "@app/hooks";
import { reset } from "@features/player/store/playerSlice";

export const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const q = searchParams.get("q") ?? "";
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) {
      setResult({ songs: [], albums: [], videos: [] });
      return;
    }
    setLoading(true);
    appAPI.search(q).then((data) => {
      setResult(data);
      setLoading(false);
    });
  }, [q]);

  return (
    <div
      style={{
        background: "linear-gradient(180.04deg, rgba(12, 12, 12, 0.7) 0px, rgb(12, 12, 12) 99.96%)",
        display: "flex",
        flexDirection: "column",
        paddingTop: "48px",
        minHeight: "100vh"
      }}
    >
      <div style={{ padding: "80px 24px 24px 24px" }}>
        <Typography component="div" fontSize={32} fontWeight={700}>
          Search results
        </Typography>
        {q && (
          <Typography component="div" fontSize={16} color="text.secondary">
            Results for &ldquo;{q}&rdquo;
          </Typography>
        )}
      </div>

      {loading && (
        <Box sx={{ p: "0 24px" }}>
          <Typography color="text.secondary">Searching...</Typography>
        </Box>
      )}

      {!loading &&
        result &&
        q &&
        !result.songs.length &&
        !result.albums.length &&
        !result.videos.length && (
          <Box sx={{ p: "0 24px" }}>
            <Typography color="text.secondary">No results found</Typography>
          </Box>
        )}

      {!loading && result && result.songs.length > 0 && (
        <ResultSection title="Songs" count={result.songs.length}>
          <SongTable
            songs={result.songs}
            ariaLabel="search songs table"
            onPlayFromIndex={(idx) =>
              dispatch(reset({ songs: [result.songs[idx]], history: [], type: "audio" }))
            }
          />
        </ResultSection>
      )}

      {!loading && result && result.albums.length > 0 && (
        <ResultSection title="Albums" count={result.albums.length}>
          <Grid container spacing={2} sx={{ px: 3 }}>
            {result.albums.map((album) => (
              <Grid key={album._id} item xs={6} sm={4} md={3} lg={2}>
                <AlbumCard album={album} />
              </Grid>
            ))}
          </Grid>
        </ResultSection>
      )}

      {!loading && result && result.videos.length > 0 && (
        <ResultSection title="Videos" count={result.videos.length}>
          <Grid container spacing={2.5} sx={{ px: 3 }}>
            {result.videos.map((video, idx) => (
              <Grid key={video._id} item xs={6} sm={4} md={3} lg={2}>
                <VideoCard
                  video={video}
                  onClick={() => dispatch(reset({ songs: [result.videos[idx]], type: "video" }))}
                />
              </Grid>
            ))}
          </Grid>
        </ResultSection>
      )}
    </div>
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
    <Box sx={{ mb: 4 }}>
      <SectionHeader title={title} count={count} sx={{ px: 3, mb: 1 }} />
      {children}
    </Box>
  );
}
