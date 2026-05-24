import React, { useEffect, useState } from "react";
import { Song } from "../../core/Song";
import { appAPI } from "../../core/api";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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

import { reset } from "../../store/player/playerSlice";
import { formatDuration } from "../../utils/formatDuration";
import { SongBitDepth } from "../player/SongBitDepth";
import { useAppDispatch, useAppSelector } from "../../store/hook";

export const Songs: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { playingTrack } = useAppSelector((state) => state.player);
  const [songs, setSongs] = useState<Song[]>([]);

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
    <div
      style={{
        background: `linear-gradient(180.04deg, rgba(12, 12, 12, 0.7) 0px, rgb(12, 12, 12) 99.96%)`,
        display: "flex",
        flexDirection: "column",
        paddingTop: "48px"
      }}
    >
      <div style={{ marginBottom: 24, paddingTop: "20dvh" }}>
        <div style={{ display: "flex", padding: "32px 24px 0px 24px" }}>
          <Box sx={{ display: "flex", flexDirection: "column", zIndex: 1 }}>
            <Typography component="div" fontSize={32} fontWeight={700}>
              Songs
            </Typography>
            <Typography component="div" fontSize={16} color="text.secondary">
              {songs.length} tracks
            </Typography>
          </Box>
        </div>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            columnGap: "16px",
            p: "0 24px 24px 24px"
          }}
        >
          <Button
            startIcon={<PlayArrowIcon />}
            variant="contained"
            aria-label="play"
            onClick={onPlayAll}
            size="large"
            style={{ textTransform: "none", backgroundColor: "white" }}
          >
            Play
          </Button>
          <Button
            startIcon={<ShuffleIcon />}
            variant="text"
            aria-label="play"
            onClick={onPlayShuffleAll}
            size="large"
            style={{
              textTransform: "none",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              color: "white"
            }}
          >
            Shuffle
          </Button>
        </Box>
      </div>

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
                        {track.artist?.join(", ")}
                      </Typography>
                    </Box>
                  </Box>
                </NoBorderTableCell>
                <NoBorderTableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                  {track.artist?.join(", ")}
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
                  <IconButton size="small" onClick={() => null}>
                    <MoreHorizIcon fontSize="medium" />
                  </IconButton>
                </NoBorderTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

const NoBorderTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: {
    border: 0
  },
  [`&.${tableCellClasses.body}`]: {
    border: 0
  }
}));
