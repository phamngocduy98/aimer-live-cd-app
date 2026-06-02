import React, { useEffect, useState } from "react";
import { Song } from "../../core/Song";
import { AppAPI, appAPI } from "../../core/api";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { tableCellClasses, IconButton } from "@mui/material";
import styled from "@emotion/styled";
import { useNavigate } from "react-router-dom";

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import MusicNoteIcon from "@mui/icons-material/MusicNote";

import { reset } from "../../store/player/playerSlice";
import { formatDuration } from "../../utils/formatDuration";
import { SongBitDepth } from "../player/SongBitDepth";
import { useAppDispatch, useAppSelector } from "../../store/hook";
import { AddToPlaylistDialog } from "../../components/dialogs/AddToPlaylistDialog";
import { artistPath, formatArtists, getPrimaryArtist } from "../../utils/artist";

export const Songs: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { playingTrack } = useAppSelector((state) => state.player);
  const [songs, setSongs] = useState<Song[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [contextSong, setContextSong] = useState<Song | null>(null);
  const [addToPlaylistOpen, setAddToPlaylistOpen] = useState(false);

  useEffect(() => {
    appAPI.listSongs().then(setSongs);
  }, []);

  const onPlayAll = () => {
    if (songs.length === 0) return;
    dispatch(reset({ songs, type: "audio" }));
  };

  const onPlayShuffleAll = () => {
    if (songs.length === 0) return;
    dispatch(reset({ songs, shuffle: true, type: "audio" }));
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#000",
        color: "white",
        backgroundImage: songs[0]?.album?._id
          ? `linear-gradient(180deg, rgba(0,0,0,.24) 0%, #000 430px), linear-gradient(90deg, rgba(0,0,0,.9), rgba(0,0,0,.48)), url("${AppAPI.HOST}/album/${songs[0].album._id}/cover")`
          : "linear-gradient(180deg, #151515 0%, #000 430px)",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        pt: "64px",
        pb: "120px"
      }}
    >
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 8, sm: 12 }, pb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: { xs: 72, sm: 96 },
              height: { xs: 72, sm: 96 },
              borderRadius: 1,
              bgcolor: "rgba(255,255,255,.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <MusicNoteIcon sx={{ fontSize: { xs: 36, sm: 48 }, color: "#d6d6d6" }} />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Typography color="#a7a7a7" fontSize={12} fontWeight={800} textTransform="uppercase">
              Collection
            </Typography>
            <Typography component="h1" sx={{ fontSize: { xs: 38, sm: 58 }, fontWeight: 900, lineHeight: 1 }}>
              Songs
            </Typography>
            <Typography component="div" fontSize={16} color="#c9c9c9" sx={{ mt: 1 }}>
              {songs.length} tracks
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
            onClick={onPlayAll}
            size="large"
            sx={{ textTransform: "none", bgcolor: "#fff", color: "#000", borderRadius: "999px", px: 3 }}
          >
            Play
          </Button>
          <Button
            startIcon={<ShuffleIcon />}
            variant="text"
            aria-label="play"
            onClick={onPlayShuffleAll}
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
        </Box>
        </Box>

      <TableContainer
        sx={{
          background: "black",
          padding: {
            xs: "8px 16px",
            sm: "8px 24px"
          },
          cursor: "default",
          userSelect: "none"
        }}
      >
        <Table
          size="small"
          aria-label="songs table"
          sx={{
            tableLayout: {
              xs: "fixed",
              sm: "auto"
            }
          }}
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
            {songs.map((track, idx) => (
              <TableRow
                hover
                key={track._id}
                selected={track._id === playingTrack?._id}
                onDoubleClick={() =>
                  dispatch(
                    reset({
                      songs: songs.slice(idx),
                      history: songs.slice(0, idx),
                      type: "audio"
                    })
                  )
                }
                sx={{
                  "&:last-child td, &:last-child th": {
                    border: 0
                  },
                  "& th": {
                    borderTopLeftRadius: "5px",
                    borderBottomLeftRadius: "5px",
                    border: 1
                  },
                  "& td:last-child": {
                    borderTopRightRadius: "5px",
                    borderBottomRightRadius: "5px"
                  },
                  "&.Mui-selected": {
                    backgroundColor: "#ffffff1a"
                  }
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
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
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
                      "&:hover": {
                        color: "white",
                        cursor: "pointer",
                        textDecoration: "underline"
                      }
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
                      "&:hover": {
                        color: "white",
                        cursor: "pointer",
                        textDecoration: "underline"
                      }
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
            setAnchorEl(null);
            setAddToPlaylistOpen(true);
          }}
        >
          <PlaylistAddIcon sx={{ mr: 1, fontSize: 20 }} />
          Add to Playlist
        </MenuItem>
      </Menu>

      <AddToPlaylistDialog
        open={addToPlaylistOpen}
        onClose={() => {
          setAddToPlaylistOpen(false);
          setContextSong(null);
        }}
        songIds={contextSong ? [contextSong._id] : []}
      />
    </Box>
  );
};

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
