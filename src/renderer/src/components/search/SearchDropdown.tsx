import React from "react";
import { useAppDispatch } from "@app/hooks";
import { router } from "@app/router";
import type { SearchResult } from "@renderer/types/shared";
import type { Album, Song, Video } from "@features/library";
import { playVideoChapter } from "@features/player/thunks/playVideoChapter";
import { apiAssetUrl } from "@lib/axios";
import { usePlaybackGate } from "@features/auth";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import { ArtistLinks } from "@components/media/ArtistLinks";

interface SearchDropdownProps {
  query: string;
  result: SearchResult | null;
  loading: boolean;
  open: boolean;
  onClose: () => void;
  onNavigate: (query: string) => void;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  query,
  result,
  loading,
  open,
  onClose,
  onNavigate
}) => {
  const dispatch = useAppDispatch();
  const play = usePlaybackGate();
  const playSource = {
    type: "search" as const,
    id: query,
    label: `Search: ${query}`,
    route: `/search?q=${encodeURIComponent(query)}`
  };

  if (!open || !query) return null;

  const handleSongClick = (song: Song): void => {
    onClose();
    play({ items: [song], playFrom: playSource });
  };

  const handleAlbumClick = (album: Album): void => {
    onClose();
    router.navigate(`/album/${album._id}`);
  };

  const handleVideoClick = (video: Video): void => {
    onClose();
    play({ items: [video], playFrom: playSource });
  };

  const handleChapterClick = (video: Video, chapterIndex: number): void => {
    onClose();
    dispatch(playVideoChapter(video, playSource, chapterIndex));
  };

  const handleViewAll = (): void => {
    onClose();
    onNavigate(query);
  };

  const hasResults =
    result &&
    (result.songs.length > 0 ||
      result.albums.length > 0 ||
      result.videos.length > 0 ||
      result.chapters.length > 0);

  return (
    <Paper
      sx={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        mt: 1.5,
        zIndex: 1300,
        bgcolor: "#2d2d2d",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: (theme) => theme.design.shadow.menu,
        color: "text.primary"
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2.5 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {!loading && !hasResults && (
        <Typography sx={{ px: 3, py: 2.5, fontWeight: 750 }} color="text.secondary" variant="body2">
          No results found
        </Typography>
      )}

      {!loading && hasResults && (
        <>
          {result.songs.length > 0 && (
            <>
              <SectionHeader title="Songs" count={result.songs.length} />
              {result.songs.slice(0, 5).map((song) => (
                <ResultRow
                  key={song._id}
                  onClick={() => handleSongClick(song)}
                  primary={song.title}
                  artists={song.artist}
                  onArtistNavigate={onClose}
                />
              ))}
            </>
          )}

          {result.albums.length > 0 && (
            <>
              <SectionHeader title="Albums" count={result.albums.length} />
              <Box sx={{ display: "flex", gap: 1.25, px: 3, pb: 1.5, overflow: "auto" }}>
                {result.albums.slice(0, 4).map((album) => (
                  <Box
                    key={album._id}
                    onClick={() => handleAlbumClick(album)}
                    sx={{
                      flex: "0 0 auto",
                      width: 80,
                      cursor: "pointer",
                      "&:hover": { opacity: 0.8 }
                    }}
                  >
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 1.5,
                        overflow: "hidden",
                        bgcolor: "rgba(255,255,255,0.05)"
                      }}
                    >
                      <Box
                        component="img"
                        src={apiAssetUrl(`/album/${album._id}/cover`)}
                        alt={album.title}
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      noWrap
                      textOverflow="ellipsis"
                      sx={{ display: "block", mt: 0.5 }}
                    >
                      {album.title}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}

          {result.videos.length > 0 && (
            <>
              <SectionHeader title="Videos" count={result.videos.length} />
              {result.videos.slice(0, 5).map((video) => (
                <ResultRow
                  key={video._id}
                  onClick={() => handleVideoClick(video)}
                  primary={video.title}
                  artists={video.artist}
                  onArtistNavigate={onClose}
                />
              ))}
            </>
          )}

          {result.chapters.length > 0 && (
            <>
              <SectionHeader title="Chapters" count={result.chapters.length} />
              {result.chapters.slice(0, 5).map(({ video, chapter, chapterIndex }) => (
                <ResultRow
                  key={`${video._id}-${chapter.time}-${chapterIndex}`}
                  onClick={() => handleChapterClick(video, chapterIndex)}
                  primary={chapter.title}
                  secondary={chapter.subTitle || video.title}
                  artists={video.artist}
                  onArtistNavigate={onClose}
                />
              ))}
            </>
          )}

          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mx: 2 }} />
          <Box
            onClick={handleViewAll}
            sx={{
              px: 3,
              py: 1.75,
              cursor: "pointer",
              "&:hover": { bgcolor: "rgba(255,255,255,.08)" }
            }}
          >
            <Typography variant="body2" color="primary" fontWeight={500} textAlign="center">
              More results
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
};

function SectionHeader({ title, count }: { title: string; count: number }): React.ReactElement {
  return (
    <Box
      sx={{
        px: 3,
        pt: 1.75,
        pb: 0.75,
        display: "flex",
        alignItems: "baseline",
        gap: 0.5
      }}
    >
      <Typography variant="caption" fontWeight={800} color="text.secondary">
        {title}
      </Typography>
      <Typography variant="caption" color="text.disabled">
        {count}
      </Typography>
    </Box>
  );
}

function ResultRow({
  primary,
  secondary,
  artists,
  onArtistNavigate,
  onClick
}: {
  primary: string;
  secondary?: string;
  artists?: string[];
  onArtistNavigate?: () => void;
  onClick: () => void;
}): React.ReactElement {
  return (
    <Box
      onClick={onClick}
      sx={{
        px: 3,
        py: 1.1,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 1,
        "&:hover": { bgcolor: "rgba(255,255,255,.08)" }
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" noWrap textOverflow="ellipsis" fontWeight={750}>
          {primary}
        </Typography>
        {secondary && (
          <Typography variant="caption" noWrap textOverflow="ellipsis" color="text.secondary">
            {secondary}
          </Typography>
        )}
        {artists && (
          <ArtistLinks
            artists={artists}
            color="text.secondary"
            fontSize="0.75rem"
            onNavigate={onArtistNavigate}
          />
        )}
      </Box>
    </Box>
  );
}
