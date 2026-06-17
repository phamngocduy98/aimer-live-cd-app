import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TextField from "@mui/material/TextField";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { ArtistLinks } from "@components/media/ArtistLinks";
import { AlbumCard } from "@components/media/AlbumCard";
import {
  MediaTable,
  MediaTableCell,
  MediaTableHead,
  MediaTableRow
} from "@components/media/MediaTable";
import { SongTable } from "@components/media/SongTable";
import { VideoCard } from "@components/media/VideoCard";
import { SectionHeader } from "@components/view/SectionHeader";
import { PageScaffold } from "@components/view/PageScaffold";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { useSearch } from "../hooks/useSearch";
import { usePlayAlbum } from "@features/album";
import { playVideoChapter } from "@features/player/thunks/playVideoChapter";
import { formatDuration } from "@utils/formatDuration";
import type { SearchChapterResult } from "@renderer/types/shared";
import { usePlaybackGate } from "@features/auth";

export const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const play = usePlaybackGate();
  const playAlbum = usePlayAlbum();
  const q = searchParams.get("q") ?? "";
  const [searchInput, setSearchInput] = React.useState(q);
  const { data: result, isLoading: loading } = useSearch(q);

  React.useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const submitSearch = (event: React.FormEvent): void => {
    event.preventDefault();
    const query = searchInput.trim();
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  };

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
        <Box component="form" onSubmit={submitSearch} sx={{ mt: { xs: 3, sm: 4 } }}>
          <TextField
            fullWidth
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search songs, albums, videos, chapters"
            inputProps={{ "aria-label": "Search library" }}
            sx={{
              maxWidth: 760,
              "& .MuiOutlinedInput-root": {
                height: 58,
                borderRadius: 1.5,
                bgcolor: "rgba(0,0,0,.42)",
                fontSize: 16,
                "& fieldset": { borderColor: "rgba(255,255,255,.12)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,.24)" },
                "&.Mui-focused fieldset": { borderColor: "#6e6e6e", borderWidth: 1 }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: "#f1f1f1" }} />
                </InputAdornment>
              )
            }}
          />
        </Box>
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
        !result.videos.length &&
        !result.chapters.length && (
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
              play({ items: result.songs, playFrom: playSource, startIndex: idx })
            }
          />
        </ResultSection>
      )}

      {!loading && result && result.chapters.length > 0 && (
        <ResultSection title="Chapters" count={result.chapters.length}>
          <SearchChapterTable chapters={result.chapters} />
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
                    play({ items: result.videos, playFrom: playSource, startIndex: idx })
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

function SearchChapterTable({
  chapters
}: {
  chapters: SearchChapterResult[];
}): React.ReactElement {
  const dispatch = useAppDispatch();
  const playingTrack = useAppSelector((state) => state.player.playingTrack);
  const currentChapterIdx = useAppSelector((state) => state.player.currentChapterIdx);

  return (
    <MediaTable ariaLabel="search chapters table">
      <MediaTableHead>
        <TableRow>
          <MediaTableCell align="center" width={30}>
            #
          </MediaTableCell>
          <MediaTableCell>TITLE</MediaTableCell>
          <MediaTableCell>VIDEO</MediaTableCell>
          <MediaTableCell>ARTIST</MediaTableCell>
          <MediaTableCell align="center">START</MediaTableCell>
          <MediaTableCell align="center">TIME</MediaTableCell>
        </TableRow>
      </MediaTableHead>
      <TableBody>
        {chapters.map((result, index) => {
          const { video, chapter, chapterIndex } = result;
          const end = video.chapters[chapterIndex + 1]?.time ?? video.duration;
          const active = playingTrack?._id === video._id && currentChapterIdx === chapterIndex;
          const playSource = {
            type: "search" as const,
            id: `${video._id}:${chapterIndex}`,
            label: `Search chapter: ${chapter.title}`,
            route: `/search?q=${encodeURIComponent(chapter.title)}`
          };

          return (
            <MediaTableRow
              hover
              key={`${video._id}-${chapter.time}-${chapterIndex}`}
              selected={active}
              aria-current={active ? "true" : undefined}
              onClick={() => dispatch(playVideoChapter(video, playSource, chapterIndex))}
              sx={{ cursor: "pointer" }}
            >
              <MediaTableCell align="center" component="th" scope="row" width={30}>
                <Typography fontSize={14} fontWeight={500} color="#79777f">
                  {index + 1}
                </Typography>
              </MediaTableCell>
              <MediaTableCell>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    className={active ? "now-playing-accent" : undefined}
                    noWrap
                    fontSize={{ xs: 17, sm: 14 }}
                    fontWeight={750}
                  >
                    {chapter.title}
                  </Typography>
                  {chapter.subTitle && (
                    <Typography noWrap color="text.secondary" fontSize={{ xs: 15, sm: 13 }}>
                      {chapter.subTitle}
                    </Typography>
                  )}
                </Box>
              </MediaTableCell>
              <MediaTableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                <Typography noWrap color="text.secondary" fontSize={14}>
                  {video.title}
                </Typography>
              </MediaTableCell>
              <MediaTableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                <ArtistLinks artists={video.artist} />
              </MediaTableCell>
              <MediaTableCell align="center" sx={{ display: { xs: "none", sm: "table-cell" } }}>
                <Typography fontSize={14} color="#919191">
                  {formatDuration(chapter.time)}
                </Typography>
              </MediaTableCell>
              <MediaTableCell align="center" sx={{ display: { xs: "none", sm: "table-cell" } }}>
                <Typography fontSize={14} color="#919191">
                  {formatDuration(Math.max(0, end - chapter.time))}
                </Typography>
              </MediaTableCell>
            </MediaTableRow>
          );
        })}
      </TableBody>
    </MediaTable>
  );
}

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
