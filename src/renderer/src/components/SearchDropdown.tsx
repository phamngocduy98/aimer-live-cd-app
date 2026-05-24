import React from "react";
import { useAppDispatch } from "../store/hook";
import { router } from "../router";
import { reset } from "../store/player/playerSlice";
import { SearchResult, AppAPI } from "../core/api";
import { Song } from "../core/Song";
import { Album } from "../core/Album";
import { Video } from "../core/Video";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";

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

  if (!open || !query) return null;

  const handleSongClick = (song: Song): void => {
    onClose();
    dispatch(reset({ songs: [song], history: [], type: "audio" }));
  };

  const handleAlbumClick = (album: Album): void => {
    onClose();
    router.navigate(`/album/${album._id}`);
  };

  const handleVideoClick = (video: Video): void => {
    onClose();
    dispatch(reset({ songs: [video], type: "video" }));
  };

  const handleViewAll = (): void => {
    onClose();
    onNavigate(query);
  };

  const hasResults =
    result && (result.songs.length > 0 || result.albums.length > 0 || result.videos.length > 0);

  return (
    <Paper
      sx={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        mt: 0.5,
        zIndex: 1300,
        bgcolor: "#1c1c21",
        border: "1px solid",
        borderColor: "rgba(255,255,255,0.08)",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {!loading && !hasResults && (
        <Typography sx={{ px: 2, py: 2 }} color="text.secondary" variant="body2">
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
                  secondary={song.artist?.join(", ")}
                />
              ))}
            </>
          )}

          {result.albums.length > 0 && (
            <>
              <SectionHeader title="Albums" count={result.albums.length} />
              <Box sx={{ display: "flex", gap: 1, px: 2, pb: 1, overflow: "auto" }}>
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
                        borderRadius: 1,
                        overflow: "hidden",
                        bgcolor: "rgba(255,255,255,0.05)"
                      }}
                    >
                      <Box
                        component="img"
                        src={`${AppAPI.HOST}/album/${album._id}/cover`}
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
                  secondary={video.artist?.join(", ")}
                />
              ))}
            </>
          )}

          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
          <Box
            onClick={handleViewAll}
            sx={{
              px: 2,
              py: 1.5,
              cursor: "pointer",
              "&:hover": { bgcolor: "rgba(255,255,255,0.04)" }
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
        px: 2,
        pt: 1.5,
        pb: 0.5,
        display: "flex",
        alignItems: "baseline",
        gap: 0.5
      }}
    >
      <Typography variant="caption" fontWeight={600} color="text.secondary">
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
  onClick
}: {
  primary: string;
  secondary?: string;
  onClick: () => void;
}): React.ReactElement {
  return (
    <Box
      onClick={onClick}
      sx={{
        px: 2,
        py: 0.75,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 1,
        "&:hover": { bgcolor: "rgba(255,255,255,0.04)" }
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" noWrap textOverflow="ellipsis">
          {primary}
        </Typography>
        {secondary && (
          <Typography variant="caption" color="text.secondary" noWrap textOverflow="ellipsis">
            {secondary}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
