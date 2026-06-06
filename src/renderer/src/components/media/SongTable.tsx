import React from "react";
import styled from "@emotion/styled";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  tableCellClasses
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { Song } from "@features/library";
import { useAppSelector } from "@app/hooks";
import { artistPath, formatArtists, getPrimaryArtist } from "@utils/artist";
import { formatDuration } from "@utils/formatDuration";
import { SongBitDepth } from "@features/player/components/SongBitDepth";
import { AddToPlaylistDialog } from "@features/playlist";
import { apiAssetUrl } from "@lib/axios";
import {
  type ActionMenuPosition,
  type ExtraMediaAction,
  SongActionsMenu
} from "./MediaActionsMenu";

interface SongTableProps {
  songs: Song[];
  ariaLabel: string;
  onPlayFromIndex: (index: number) => void;
  getIndexLabel?: (song: Song, index: number) => React.ReactNode;
  showArtist?: boolean;
  showAlbum?: boolean;
  showQuality?: boolean;
  showActions?: boolean;
  showAddToPlaylist?: boolean;
  showArtwork?: boolean;
  mobileEmphasis?: boolean;
  mobileSubtitle?: "artist" | "album";
  getExtraActions?: (song: Song) => ExtraMediaAction[];
}

export const SongTable: React.FC<SongTableProps> = ({
  songs,
  ariaLabel,
  onPlayFromIndex,
  getIndexLabel = (_song, index) => index + 1,
  showArtist = true,
  showAlbum = true,
  showQuality = true,
  showActions = false,
  showAddToPlaylist = false,
  showArtwork = false,
  mobileEmphasis = false,
  mobileSubtitle = "artist",
  getExtraActions
}) => {
  const navigate = useNavigate();
  const { playingTrack } = useAppSelector((state) => state.player);
  const [contextSong, setContextSong] = React.useState<Song | null>(null);
  const [playlistSong, setPlaylistSong] = React.useState<Song | null>(null);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [anchorPosition, setAnchorPosition] = React.useState<ActionMenuPosition | null>(null);
  const closeActions = () => {
    setAnchorEl(null);
    setAnchorPosition(null);
  };

  return (
    <TableContainer
      sx={{
        background: "transparent",
        padding: { xs: "6px 8px", sm: "8px 0" },
        cursor: "default",
        userSelect: "none"
      }}
    >
      <Table size="small" aria-label={ariaLabel} sx={{ tableLayout: { xs: "fixed", sm: "auto" } }}>
        <TableHead sx={{ display: { xs: "none", sm: "table-header-group" } }}>
          <TableRow>
            <NoBorderTableCell align="center" width={30}>
              #
            </NoBorderTableCell>
            <NoBorderTableCell>TITLE</NoBorderTableCell>
            {showArtist && <NoBorderTableCell>ARTIST</NoBorderTableCell>}
            {showAlbum && <NoBorderTableCell>ALBUM</NoBorderTableCell>}
            {showQuality && <NoBorderTableCell align="center">QUALITY</NoBorderTableCell>}
            <NoBorderTableCell align="center">TIME</NoBorderTableCell>
            {showActions && (
              <NoBorderTableCell
                align="center"
                width={showAddToPlaylist ? 88 : 44}
              ></NoBorderTableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {songs.map((song, index) => {
            const isPlaying = song._id === playingTrack?._id;
            const mobileText =
              mobileSubtitle === "album"
                ? (song.album?.title ?? "Unknown")
                : formatArtists(song.artist);

            return (
              <TableRow
                hover
                key={song._id}
                selected={isPlaying}
                onDoubleClick={() => onPlayFromIndex(index)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  setContextSong(song);
                  setAnchorEl(null);
                  setAnchorPosition({ top: event.clientY, left: event.clientX });
                }}
                sx={{
                  transition: "background-color .16s ease",
                  "&:hover": { backgroundColor: "rgba(255,255,255,.065)" },
                  "&:last-child td, &:last-child th": { border: 0 },
                  "& th": {
                    borderTopLeftRadius: "5px",
                    borderBottomLeftRadius: "5px",
                    border: 1
                  },
                  "& td:last-child": {
                    borderTopRightRadius: "5px",
                    borderBottomRightRadius: "5px"
                  },
                  "&.Mui-selected": { backgroundColor: "rgba(38,231,223,.11)" }
                }}
              >
                <NoBorderTableCell align="center" component="th" scope="row" width={30}>
                  {!isPlaying ? (
                    <Typography fontSize="14px" fontWeight={500} color="#79777f">
                      {getIndexLabel(song, index)}
                    </Typography>
                  ) : (
                    <VolumeUpIcon style={{ width: 16, height: 16 }} />
                  )}
                </NoBorderTableCell>
                <NoBorderTableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                    {showArtwork && (
                      <Box
                        component="img"
                        src={apiAssetUrl(`/album/${song.album?._id}/cover`)}
                        alt=""
                        sx={{
                          width: { xs: 52, sm: 44 },
                          height: { xs: 52, sm: 44 },
                          borderRadius: 0.75,
                          objectFit: "cover",
                          bgcolor: "#181818",
                          flexShrink: 0
                        }}
                      />
                    )}
                    <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <Typography
                        noWrap
                        textOverflow="ellipsis"
                        sx={{
                          fontSize: { xs: mobileEmphasis ? 17 : 14, sm: 14 },
                          fontWeight: mobileEmphasis ? 750 : 600
                        }}
                      >
                        {song.title}
                      </Typography>
                      <Box sx={{ display: { xs: "block", sm: "none" } }}>
                        <Typography
                          noWrap
                          textOverflow="ellipsis"
                          fontSize={mobileEmphasis ? 15 : 14}
                          color={mobileEmphasis ? "#f2f2f2" : "#919191"}
                          fontWeight={mobileEmphasis ? 650 : 400}
                        >
                          {mobileText}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </NoBorderTableCell>
                {showArtist && (
                  <NoBorderTableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                    <MetadataLink
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(artistPath(getPrimaryArtist(song.artist)));
                      }}
                    >
                      {formatArtists(song.artist)}
                    </MetadataLink>
                  </NoBorderTableCell>
                )}
                {showAlbum && (
                  <NoBorderTableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                    <MetadataLink
                      onClick={(event) => {
                        event.stopPropagation();
                        if (song.album?._id) navigate(`/album/${song.album._id}`);
                      }}
                    >
                      {song.album?.title ?? "Unknown"}
                    </MetadataLink>
                  </NoBorderTableCell>
                )}
                {showQuality && (
                  <NoBorderTableCell
                    align="center"
                    sx={{ display: { xs: "none", sm: "table-cell" } }}
                  >
                    <SongBitDepth song={song} />
                  </NoBorderTableCell>
                )}
                <NoBorderTableCell
                  align="center"
                  sx={{ display: { xs: "none", sm: "table-cell" } }}
                >
                  <Typography fontSize="14px" color="#919191">
                    {formatDuration(song.duration)}
                  </Typography>
                </NoBorderTableCell>
                {showActions && (
                  <NoBorderTableCell
                    align="center"
                    width={showAddToPlaylist ? 88 : 44}
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    {showAddToPlaylist && (
                      <IconButton
                        size="small"
                        aria-label={`Add ${song.title} to playlist`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setPlaylistSong(song);
                        }}
                      >
                        <AddRoundedIcon fontSize="medium" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      aria-label="More actions"
                      onClick={(event) => {
                        event.stopPropagation();
                        setContextSong(song);
                        setAnchorPosition(null);
                        setAnchorEl(event.currentTarget);
                      }}
                    >
                      <MoreHorizIcon fontSize="medium" />
                    </IconButton>
                  </NoBorderTableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <SongActionsMenu
        track={contextSong}
        open={Boolean(anchorEl || anchorPosition)}
        anchorEl={anchorEl}
        anchorPosition={anchorPosition}
        onClose={closeActions}
        extraActions={contextSong ? (getExtraActions?.(contextSong) ?? []) : []}
      />
      <AddToPlaylistDialog
        open={Boolean(playlistSong)}
        onClose={() => setPlaylistSong(null)}
        songIds={playlistSong ? [playlistSong._id] : []}
      />
    </TableContainer>
  );
};

const MetadataLink: React.FC<
  React.PropsWithChildren<{ onClick: (event: React.MouseEvent) => void }>
> = ({ children, onClick }) => (
  <Typography
    noWrap
    textOverflow="ellipsis"
    fontSize="14px"
    color="#a0a0a0"
    sx={{
      "&:hover": {
        color: "white",
        cursor: "pointer",
        textDecoration: "underline"
      }
    }}
    onClick={onClick}
  >
    {children}
  </Typography>
);

const NoBorderTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: {
    border: 0,
    color: "#9b9b9b",
    fontSize: 12
  },
  [`&.${tableCellClasses.body}`]: {
    border: 0
  }
}));
