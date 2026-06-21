import React from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { Box, IconButton, TableBody, TableRow, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { isVideo, type Song, type Video } from "@features/library";
import { useAppSelector } from "@app/hooks";
import { formatArtists } from "@utils/artist";
import { formatDuration } from "@utils/formatDuration";
import { SongBitDepth } from "@features/player/components/SongBitDepth";
import { VideoBitDepth } from "@features/player/components/SongBitDepth";
import { AddToPlaylistDialog } from "@features/playlist";
import { apiAssetUrl } from "@lib/axios";
import { mediaArtworkUrl } from "@utils/mediaArtwork";
import {
  type ActionMenuPosition,
  type ExtraMediaAction,
  SongActionsMenu
} from "./MediaActionsMenu";
import type { PlaySource } from "@features/player/types";
import { isCurrentSourceItem, sourceItemKey } from "@features/player/types";
import { ArtistLinks } from "./ArtistLinks";
import { MediaTable, MediaTableCell, MediaTableHead, MediaTableRow } from "./MediaTable";
import {
  SongTableIndexCell,
  SongTableTitleText,
  songTableBodyColumnDisplay,
  songTableHeadColumnDisplay
} from "./SongTableShared";

interface SongTableProps<T extends Song | Video = Song> {
  songs: T[];
  ariaLabel: string;
  onPlayFromIndex?: (index: number) => void;
  getIndexLabel?: (song: T, index: number) => React.ReactNode;
  showArtist?: boolean;
  showAlbum?: boolean;
  showQuality?: boolean;
  showActions?: boolean;
  showAddToPlaylist?: boolean;
  showArtwork?: boolean;
  showRequestedBy?: boolean;
  showPlayedAt?: boolean;
  mobileSubtitle?: "artist" | "album";
  getExtraActions?: (song: T) => ExtraMediaAction[];
  getRowKey?: (song: T, index: number) => React.Key;
  getIsActive?: (song: T, index: number) => boolean;
  getRequestedByLabel?: (song: T, index: number) => React.ReactNode;
  getPlayedAtLabel?: (song: T, index: number) => React.ReactNode;
  playSource?: PlaySource;
  readOnly?: boolean;
}

export function SongTable<T extends Song | Video = Song>({
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
  showRequestedBy = false,
  showPlayedAt = false,
  mobileSubtitle = "artist",
  getExtraActions,
  getRowKey,
  getIsActive,
  getRequestedByLabel,
  getPlayedAtLabel,
  playSource,
  readOnly = false
}: SongTableProps<T>): React.ReactElement {
  const navigate = useNavigate();
  const { playingTrack, currentEntry } = useAppSelector((state) => state.player);
  const [contextSong, setContextSong] = React.useState<T | null>(null);
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
          {!readOnly && (
            <SongActionsMenu
              track={contextSong}
              open={Boolean(anchorEl || anchorPosition)}
              anchorEl={anchorEl}
              anchorPosition={anchorPosition}
              onClose={closeActions}
              extraActions={contextSong ? (getExtraActions?.(contextSong) ?? []) : []}
            />
          )}
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
            <MediaTableCell sx={{ display: songTableHeadColumnDisplay.detail }}>
              ALBUM
            </MediaTableCell>
          )}
          {showQuality && (
            <MediaTableCell align="center" sx={{ display: songTableHeadColumnDisplay.metadata }}>
              QUALITY
            </MediaTableCell>
          )}
          {showRequestedBy && (
            <MediaTableCell sx={{ display: songTableHeadColumnDisplay.detail }}>
              REQUESTED BY
            </MediaTableCell>
          )}
          {showPlayedAt && (
            <MediaTableCell align="center" sx={{ display: songTableHeadColumnDisplay.metadata }}>
              PLAYED
            </MediaTableCell>
          )}
          <MediaTableCell align="center" sx={{ display: songTableHeadColumnDisplay.metadata }}>
            TIME
          </MediaTableCell>
          {showActions && (
            <MediaTableCell align="center" width={showAddToPlaylist ? 88 : 44}></MediaTableCell>
          )}
        </TableRow>
      </MediaTableHead>
      <TableBody>
        {songs.map((song, index) => {
          const itemKey = playSource ? sourceItemKey(playSource, song, index) : undefined;
          const isPlaying =
            getIsActive?.(song, index) ??
            (playSource
              ? isCurrentSourceItem(currentEntry, playSource, song, itemKey)
              : song._id === playingTrack?._id);
          const mobileText =
            mobileSubtitle === "album" && !isVideo(song)
              ? (song.album?.title ?? "Unknown")
              : isVideo(song) && mobileSubtitle === "album"
                ? "Video"
                : formatArtists(song.artist);
          const requestedByLabel = getRequestedByLabel?.(song, index);
          const playedAtLabel = getPlayedAtLabel?.(song, index);

          return (
            <MediaTableRow
              hover
              key={getRowKey?.(song, index) ?? song._id}
              selected={isPlaying}
              onDoubleClick={readOnly ? undefined : () => onPlayFromIndex?.(index)}
              onContextMenu={(event) => {
                if (readOnly) return;
                event.preventDefault();
                setContextSong(song);
                setAnchorEl(null);
                setAnchorPosition({ top: event.clientY, left: event.clientX });
              }}
            >
              <MediaTableCell align="center" component="th" scope="row" width={30}>
                <SongTableIndexCell active={isPlaying}>
                  {getIndexLabel(song, index)}
                </SongTableIndexCell>
              </MediaTableCell>
              <MediaTableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                  {showArtwork && (
                    <Box
                      component="img"
                      src={
                        isVideo(song)
                          ? mediaArtworkUrl(song)
                          : apiAssetUrl(`/album/${song.album?._id}/cover`)
                      }
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
                    <SongTableTitleText active={isPlaying}>{song.title}</SongTableTitleText>
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
                      {(showRequestedBy || showPlayedAt) && (
                        <Typography
                          noWrap
                          textOverflow="ellipsis"
                          fontSize={13}
                          color={"#777"}
                          fontWeight={600}
                        >
                          {showRequestedBy && <>Requested by {requestedByLabel ?? "—"}</>}
                          {showRequestedBy && showPlayedAt && " · "}
                          {showPlayedAt && <>{playedAtLabel ?? "—"}</>}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              </MediaTableCell>
              {showArtist && (
                <MediaTableCell sx={{ display: songTableBodyColumnDisplay.artist }}>
                  <ArtistLinks artists={song.artist} />
                </MediaTableCell>
              )}
              {showAlbum && (
                <MediaTableCell sx={{ display: songTableBodyColumnDisplay.detail }}>
                  {isVideo(song) ? (
                    <Typography noWrap textOverflow="ellipsis" fontSize="14px" color="#a0a0a0">
                      Video
                    </Typography>
                  ) : (
                    <MetadataLink
                      onClick={(event) => {
                        event.stopPropagation();
                        if (song.album?._id) navigate(`/album/${song.album._id}`);
                      }}
                    >
                      {song.album?.title ?? "Unknown"}
                    </MetadataLink>
                  )}
                </MediaTableCell>
              )}
              {showQuality && (
                <MediaTableCell
                  align="center"
                  sx={{ display: songTableBodyColumnDisplay.metadata }}
                >
                  {isVideo(song) ? <VideoBitDepth video={song} /> : <SongBitDepth song={song} />}
                </MediaTableCell>
              )}
              {showRequestedBy && (
                <MediaTableCell sx={{ display: songTableBodyColumnDisplay.detail }}>
                  <Typography noWrap textOverflow="ellipsis" fontSize="14px" color="#a0a0a0">
                    {requestedByLabel ?? "—"}
                  </Typography>
                </MediaTableCell>
              )}
              {showPlayedAt && (
                <MediaTableCell
                  align="center"
                  sx={{ display: songTableBodyColumnDisplay.metadata }}
                >
                  <Typography fontSize="14px" color="#919191">
                    {playedAtLabel ?? "—"}
                  </Typography>
                </MediaTableCell>
              )}
              <MediaTableCell align="center" sx={{ display: songTableBodyColumnDisplay.metadata }}>
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
                      disabled={isVideo(song)}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!isVideo(song)) setPlaylistSong(song);
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
}

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
