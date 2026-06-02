import React, { useEffect, useState } from "react";
import { Video } from "../../core/Video";
import { AppAPI, appAPI } from "../../core/api";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { tableCellClasses } from "@mui/material";
import styled from "@emotion/styled";
import { useNavigate } from "react-router-dom";

import { formatDuration } from "../../utils/formatDuration";
import { useAppDispatch, useAppSelector } from "../../store/hook";
import { reset } from "../../store/player/playerSlice";
import { artistPath, formatArtists, getPrimaryArtist } from "../../utils/artist";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import VideocamIcon from "@mui/icons-material/Videocam";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";

export const Videos: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { playingTrack } = useAppSelector((state) => state.player);
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    appAPI.listVideos().then(setVideos);
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#000",
        color: "white",
        backgroundImage: videos[0]?.album?._id
          ? `linear-gradient(180deg, rgba(0,0,0,.24) 0%, #000 430px), linear-gradient(90deg, rgba(0,0,0,.9), rgba(0,0,0,.48)), url("${AppAPI.HOST}/album/${videos[0].album._id}/cover")`
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
            <VideocamIcon sx={{ fontSize: { xs: 36, sm: 48 }, color: "#d6d6d6" }} />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Typography color="#a7a7a7" fontSize={12} fontWeight={800} textTransform="uppercase">
              Collection
            </Typography>
            <Typography component="h1" sx={{ fontSize: { xs: 38, sm: 58 }, fontWeight: 900, lineHeight: 1 }}>
              Videos
            </Typography>
            <Typography component="div" fontSize={16} color="#c9c9c9" sx={{ mt: 1 }}>
              {videos.length} videos
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 3, flexWrap: "wrap" }}>
          <Button
            startIcon={<PlayArrowIcon />}
            variant="contained"
            aria-label="play videos"
            onClick={() => {
              if (videos.length === 0) return;
              dispatch(reset({ songs: videos, type: "video" }));
            }}
            size="large"
            sx={{ textTransform: "none", bgcolor: "#fff", color: "#000", borderRadius: "999px", px: 3 }}
          >
            Play
          </Button>
          <Button
            startIcon={<ShuffleIcon />}
            variant="contained"
            aria-label="shuffle videos"
            onClick={() => {
              if (videos.length === 0) return;
              dispatch(reset({ songs: videos, shuffle: true, type: "video" }));
            }}
            size="large"
            sx={{ textTransform: "none", bgcolor: "rgba(255,255,255,.2)", color: "#fff", borderRadius: "999px", px: 3 }}
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
          userSelect: "none",
          overflowX: "auto"
        }}
      >
        <Table size="small" aria-label="videos table" sx={{ tableLayout: "fixed" }}>
          <TableHead sx={{ display: { xs: "none", sm: "table-header-group" } }}>
            <TableRow>
              <NoBorderTableCell align="center" width={30}>
                #
              </NoBorderTableCell>
              <NoBorderTableCell sx={{ width: "25%" }}>TITLE</NoBorderTableCell>
              <NoBorderTableCell sx={{ width: "15%" }}>ARTIST</NoBorderTableCell>
              <NoBorderTableCell sx={{ width: "30%" }}>ALBUM</NoBorderTableCell>
              <NoBorderTableCell align="center" sx={{ width: "15%" }}>
                QUALITY
              </NoBorderTableCell>
              <NoBorderTableCell align="center" sx={{ width: "15%" }}>
                TIME
              </NoBorderTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {videos.map((track, idx) => (
              <TableRow
                hover
                key={track._id}
                selected={track._id === playingTrack?._id}
                onDoubleClick={() =>
                  dispatch(
                    reset({
                      songs: videos.slice(idx),
                      history: videos.slice(0, idx),
                      type: "video"
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
                  <Typography fontSize="14px" color="#919191">
                    {track.format}
                  </Typography>
                </NoBorderTableCell>
                <NoBorderTableCell
                  align="center"
                  sx={{ display: { xs: "none", sm: "table-cell" } }}
                >
                  <Typography fontSize="14px" color="#919191">
                    {formatDuration(track.duration)}
                  </Typography>
                </NoBorderTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
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
