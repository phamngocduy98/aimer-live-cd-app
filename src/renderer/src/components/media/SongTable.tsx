import React from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { Box, IconButton, TableBody, TableRow, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { Song } from "@features/library";
import { useAppSelector } from "@app/hooks";
import { formatArtists } from "@utils/artist";
import { formatDuration } from "@utils/formatDuration";
import { SongBitDepth } from "@features/player/components/SongBitDepth";
import { AddToPlaylistDialog } from "@features/playlist";
import { apiAssetUrl } from "@lib/axios";
import {
  type ActionMenuPosition,
  type ExtraMediaAction,
  SongActionsMenu
} from "./MediaActionsMenu";
import type { PlaySource } from "@features/player/types";
import { isCurrentSourceItem, sourceItemKey } from "@features/player/types";
import { ArtistLinks } from "./ArtistLinks";
import { MediaTable, MediaTableCell, MediaTableHead, MediaTableRow } from "./MediaTable";

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
  mobileSubtitle?: "artist" | "album";
  getExtraActions?: (song: Song) => ExtraMediaAction[];
  playSource?: PlaySource;
}

export const SongTable: React.FC<SongTableProps> = ({
  songs,
  ariaLabel,
  onPlayFromIndex,
  getIndexLabel = (_song, index): React.ReactNode => index + 1,
  showArtist = true,
  showAlbum = true,
  showQuality = true,
  showActions = false,
  showAddToPlaylist = false,
  showArtwork = false,
  mobileSubtitle = "artist",
  getExtraActions,
  playSource
}): React.ReactElement => {
  const navigate = useNavigate();
  const { playingTrack, currentEntry } = useAppSelector((state) => state.player);
  const [contextSong, setContextSong] = React.useState<Song | null>(null);
  const [playlistSong, setPlaylistSong] = React.useState<Song | null>(null);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [anchorPosition, setAnchorPosition] = React.useState<ActionMenuPosition | null>(null);
  const closeActions = (): void => {
    setAnchorEl(null);
    setAnchorPosition(null);
  };

  return (
    <MediaTable
      ariaLabel={ariaLabel}
      after={
        <>
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
        </>
      }
    >
      <MediaTableHead>
        <TableRow>
          <MediaTableCell align="center" width={30}>
            #
          </MediaTableCell>
          <MediaTableCell>TITLE</MediaTableCell>
          {showArtist && <MediaTableCell>ARTIST</MediaTableCell>}
          {showAlbum && (
            <MediaTableCell sx={{ display: { sm: "none", md: "table-cell" } }}>
              ALBUM
            </MediaTableCell>
          )}
          {showQuality && (
            <MediaTableCell align="center" sx={{ display: { sm: "none", lg: "table-cell" } }}>
              QUALITY
            </MediaTableCell>
          )}
          <MediaTableCell align="center" sx={{ display: { sm: "none", lg: "table-cell" } }}>
            TIME
          </MediaTableCell>
          {showActions && (
            <MediaTableCell
              align="center"
              width={showAddToPlaylist ? 88 : 44}
            ></MediaTableCell>
          )}
        </TableRow>
      </MediaTableHead>
      <TableBody>
        {songs.map((song, index) => {
          const itemKey = playSource ? sourceItemKey(playSource, song, index) : undefined;
          const isPlaying = playSource
            ? isCurrentSourceItem(currentEntry, playSource, song, itemKey)
            : song._id === playingTrack?._id;
          const mobileText =
            mobileSubtitle === "album"
              ? (song.album?.title ?? "Unknown")
              : formatArtists(song.artist);

          return (
            <MediaTableRow
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
            >
              <MediaTableCell align="center" component="th" scope="row" width={30}>
                {!isPlaying ? (
                  <Typography fontSize="14px" fontWeight={500} color="#79777f">
                    {getIndexLabel(song, index)}
                  </Typography>
                ) : (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <VolumeUpIcon
                      className="now-playing-accent"
                      sx={{ width: 16, height: 16 }}
                    />
                  </Box>
                )}
              </MediaTableCell>
              <MediaTableCell>
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
                      className={isPlaying ? "now-playing-accent" : undefined}
                      noWrap
                      textOverflow="ellipsis"
                      sx={{
                        fontSize: { xs: "14px", sm: "inherit" },
                        fontWeight: 600
                      }}
                    >
                      {song.title}
                    </Typography>
                    <Box sx={{ display: { xs: "block", sm: "none" } }}>
                      {mobileSubtitle === "artist" ? (
                        <ArtistLinks
                          artists={song.artist}
                          fontSize={14}
                          color={"#919191"}
                          fontWeight={600}
                        />
                      ) : (
                        <Typography
                          noWrap
                          textOverflow="ellipsis"
                          fontSize={14}
                          color={"#919191"}
                          fontWeight={600}
                        >
                          {mobileText}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              </MediaTableCell>
              {showArtist && (
                <MediaTableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                  <ArtistLinks artists={song.artist} />
                </MediaTableCell>
              )}
              {showAlbum && (
                <MediaTableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                  <MetadataLink
                    onClick={(event) => {
                      event.stopPropagation();
                      if (song.album?._id) navigate(`/album/${song.album._id}`);
                    }}
                  >
                    {song.album?.title ?? "Unknown"}
                  </MetadataLink>
                </MediaTableCell>
              )}
              {showQuality && (
                <MediaTableCell align="center" sx={{ display: { xs: "none", lg: "table-cell" } }}>
                  <SongBitDepth song={song} />
                </MediaTableCell>
              )}
              <MediaTableCell align="center" sx={{ display: { xs: "none", lg: "table-cell" } }}>
                <Typography fontSize="14px" color="#919191">
                  {formatDuration(song.duration)}
                </Typography>
              </MediaTableCell>
              {showActions && (
                <MediaTableCell
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
                </MediaTableCell>
              )}
            </MediaTableRow>
          );
        })}
      </TableBody>
    </MediaTable>
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
