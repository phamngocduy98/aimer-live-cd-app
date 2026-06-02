import React, { useEffect, useState } from "react";
import { PlaylistDetail } from "../../core/Playlist";
import { appAPI } from "../../core/api";
import { useNavigate, useParams } from "react-router-dom";
import { Song } from "../../core/Song";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { tableCellClasses } from "@mui/material";
import styled from "@emotion/styled";

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";

import { reset } from "../../store/player/playerSlice";
import { formatDuration } from "../../utils/formatDuration";
import { SongBitDepth } from "../player/SongBitDepth";
import { useAppDispatch, useAppSelector } from "../../store/hook";
import { usePlaylistRefresh } from "../../contexts/PlaylistRefreshContext";
import { artistPath, formatArtists, getPrimaryArtist } from "../../utils/artist";

export const PlaylistView: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { playingTrack } = useAppSelector((state) => state.player);
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [contextSong, setContextSong] = useState<Song | null>(null);
  const { triggerRefresh } = usePlaylistRefresh();
  let { id } = useParams();

  useEffect(() => {
    if (id == null) return;
    appAPI.getPlaylist(id).then(setPlaylist);
  }, [id]);

  const handleDelete = async () => {
    if (id == null || !playlist) return;
    await appAPI.deletePlaylist(id);
    triggerRefresh();
    navigate("/playlists");
  };

  const handleRemoveSong = async (songId: string) => {
    if (id == null) return;
    await appAPI.removeSongFromPlaylist(id, songId);
    setPlaylist((prev) =>
      prev ? { ...prev, songs: prev.songs.filter((s) => s._id !== songId) } : prev
    );
    setAnchorEl(null);
  };

  if (playlist == null) return null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#000",
        color: "white",
        background: "linear-gradient(180deg, #171717 0%, #000 430px)",
        pt: "64px",
        pb: "120px"
      }}
    >
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 8, sm: 12 }, pb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 2, sm: 3 }, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
          <Box
            sx={{
              width: { xs: 120, sm: 180 },
              height: { xs: 120, sm: 180 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #2c2c2c 0%, #111 100%)",
              borderRadius: 1,
              flexShrink: 0
            }}
          >
            <QueueMusicIcon sx={{ fontSize: 80, color: "#727272" }} />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", zIndex: 1, minWidth: 0 }}>
            <Typography color="#a7a7a7" fontSize={12} fontWeight={800} textTransform="uppercase">
              Playlist
            </Typography>
            <Typography component="h1" sx={{ fontSize: { xs: 38, sm: 58 }, fontWeight: 900, lineHeight: 1 }} noWrap>
              {playlist.name}
            </Typography>
            {playlist.description && (
              <Typography component="div" fontSize={14} color="#c9c9c9" sx={{ mt: 1 }}>
                {playlist.description}
              </Typography>
            )}
            <Typography component="div" fontSize={14} color="#a7a7a7" sx={{ mt: 0.75 }}>
              {playlist.songs.length} songs
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mt: 3,
            flexWrap: "wrap"
          }}
        >
          <Button
            startIcon={<PlayArrowIcon />}
            variant="contained"
            aria-label="play"
            onClick={() => {
              if (playlist.songs.length === 0) return;
              dispatch(reset({ songs: playlist.songs, type: "audio" }));
            }}
            size="large"
            sx={{ textTransform: "none", bgcolor: "#fff", color: "#000", borderRadius: "999px", px: 3 }}
          >
            Play
          </Button>
          <Button
            startIcon={<ShuffleIcon />}
            variant="text"
            aria-label="shuffle"
            onClick={() => {
              if (playlist.songs.length === 0) return;
              dispatch(reset({ songs: playlist.songs, shuffle: true, type: "audio" }));
            }}
            size="large"
            sx={{
              textTransform: "none",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              color: "white",
              borderRadius: "999px",
              px: 3
            }}
          >
            Shuffle
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={handleDelete}
            sx={{ ml: { sm: "auto" }, textTransform: "none", borderRadius: "999px", px: 2 }}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <TableContainer
        sx={{
          background: "black",
          padding: { xs: "8px 16px", sm: "8px 24px" },
          cursor: "default",
          userSelect: "none"
        }}
      >
        <Table
          size="small"
          aria-label="playlist songs table"
          sx={{ tableLayout: { xs: "fixed", sm: "auto" } }}
        >
          <TableHead sx={{ display: { xs: "none", sm: "table-header-group" } }}>
            <TableRow>
              <NoBorderTableCell align="center" width={30}>
                #
              </NoBorderTableCell>
              <NoBorderTableCell>TITLE</NoBorderTableCell>
              <NoBorderTableCell>ARTIST</NoBorderTableCell>
              <NoBorderTableCell>ALBUM</NoBorderTableCell>
              <NoBorderTableCell align="center">QUALITY</NoBorderTableCell>
              <NoBorderTableCell align="center">TIME</NoBorderTableCell>
              <NoBorderTableCell align="center" width={30}></NoBorderTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {playlist.songs.map((track, idx) => (
              <TableRow
                hover
                key={track._id}
                selected={track._id === playingTrack?._id}
                onDoubleClick={() =>
                  dispatch(
                    reset({
                      songs: playlist.songs.slice(idx),
                      history: playlist.songs.slice(0, idx),
                      type: "audio"
                    })
                  )
                }
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
                  {track._id !== playingTrack?._id ? (
                    <Typography fontSize="14px" fontWeight={500} color="#79777f">
                      {idx + 1}
                    </Typography>
                  ) : (
                    <VolumeUpIcon style={{ width: 16, height: 16 }} />
                  )}
                </NoBorderTableCell>
                <NoBorderTableCell>
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Box>
                      <Typography noWrap textOverflow="ellipsis" fontSize="14px">
                        {track.title}
                      </Typography>
                    </Box>
                    <Box sx={{ display: { xs: "block", sm: "none" } }}>
                      <Typography noWrap textOverflow="ellipsis" fontSize="14px" color="#919191">
                        {formatArtists(track.artist)}
                      </Typography>
                    </Box>
                  </Box>
                </NoBorderTableCell>
                <NoBorderTableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                  <Typography
                    noWrap
                    textOverflow="ellipsis"
                    fontSize="14px"
                    color="#a0a0a0"
                    sx={{
                      "&:hover": { color: "white", cursor: "pointer", textDecoration: "underline" }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(artistPath(getPrimaryArtist(track.artist)));
                    }}
                  >
                    {formatArtists(track.artist)}
                  </Typography>
                </NoBorderTableCell>
                <NoBorderTableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                  <Typography
                    noWrap
                    textOverflow="ellipsis"
                    fontSize="14px"
                    color="#a0a0a0"
                    sx={{
                      "&:hover": { color: "white", cursor: "pointer", textDecoration: "underline" }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (track.album?._id) navigate(`/album/${track.album._id}`);
                    }}
                  >
                    {track.album?.title ?? "Unknown"}
                  </Typography>
                </NoBorderTableCell>
                <NoBorderTableCell
                  align="center"
                  sx={{ display: { xs: "none", sm: "table-cell" } }}
                >
                  <SongBitDepth song={track} />
                </NoBorderTableCell>
                <NoBorderTableCell
                  align="center"
                  sx={{ display: { xs: "none", sm: "table-cell" } }}
                >
                  <Typography fontSize="14px" color="#919191">
                    {formatDuration(track.duration)}
                  </Typography>
                </NoBorderTableCell>
                <NoBorderTableCell align="center" width={60}>
                  <IconButton
                    size="small"
                    aria-label="More actions"
                    onClick={(e) => {
                      setAnchorEl(e.currentTarget);
                      setContextSong(track);
                    }}
                  >
                    <MoreHorizIcon fontSize="medium" />
                  </IconButton>
                </NoBorderTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            if (contextSong) handleRemoveSong(contextSong._id);
          }}
        >
          Remove from playlist
        </MenuItem>
      </Menu>
    </Box>
  );
};

const NoBorderTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: { border: 0, color: "#9b9b9b", fontSize: 12 },
  [`&.${tableCellClasses.body}`]: { border: 0 }
}));
