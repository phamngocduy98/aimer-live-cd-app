import React from "react";
import styled from "@emotion/styled";
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

interface SongTableProps {
  songs: Song[];
  ariaLabel: string;
  onPlayFromIndex: (index: number) => void;
  getIndexLabel?: (song: Song, index: number) => React.ReactNode;
  showArtist?: boolean;
  showAlbum?: boolean;
  showQuality?: boolean;
  showActions?: boolean;
  mobileSubtitle?: "artist" | "album";
  onActionClick?: (event: React.MouseEvent<HTMLElement>, song: Song) => void;
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
  mobileSubtitle = "artist",
  onActionClick
}) => {
  const navigate = useNavigate();
  const { playingTrack } = useAppSelector((state) => state.player);

  return (
    <TableContainer
      sx={{
        background: "black",
        padding: { xs: "8px 16px", sm: "8px 24px" },
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
            {showActions && <NoBorderTableCell align="center" width={30}></NoBorderTableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {songs.map((song, index) => {
            const isPlaying = song._id === playingTrack?._id;
            const mobileText =
              mobileSubtitle === "album" ? song.album?.title ?? "Unknown" : formatArtists(song.artist);

            return (
              <TableRow
                hover
                key={song._id}
                selected={isPlaying}
                onDoubleClick={() => onPlayFromIndex(index)}
                sx={{
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
                  "&.Mui-selected": { backgroundColor: "#ffffff1a" }
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
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography noWrap textOverflow="ellipsis" fontSize="14px">
                      {song.title}
                    </Typography>
                    <Box sx={{ display: { xs: "block", sm: "none" } }}>
                      <Typography noWrap textOverflow="ellipsis" fontSize="14px" color="#919191">
                        {mobileText}
                      </Typography>
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
                  <NoBorderTableCell align="center" sx={{ display: { xs: "none", sm: "table-cell" } }}>
                    <SongBitDepth song={song} />
                  </NoBorderTableCell>
                )}
                <NoBorderTableCell align="center" sx={{ display: { xs: "none", sm: "table-cell" } }}>
                  <Typography fontSize="14px" color="#919191">
                    {formatDuration(song.duration)}
                  </Typography>
                </NoBorderTableCell>
                {showActions && (
                  <NoBorderTableCell align="center" width={60}>
                    <IconButton
                      size="small"
                      aria-label="More actions"
                      onClick={(event) => onActionClick?.(event, song)}
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
    </TableContainer>
  );
};

const MetadataLink: React.FC<React.PropsWithChildren<{ onClick: (event: React.MouseEvent) => void }>> = ({
  children,
  onClick
}) => (
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
