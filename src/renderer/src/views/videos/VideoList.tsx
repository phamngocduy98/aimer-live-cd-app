import React, { useEffect, useState } from "react";
import { Video } from "../../core/Video";
import { appAPI } from "../../core/api";

import Box from "@mui/material/Box";
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

export const Videos: React.FC = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    appAPI.listVideos().then(setVideos);
  }, []);

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
              Videos
            </Typography>
            <Typography component="div" fontSize={16} color="text.secondary">
              {videos.length} tracks
            </Typography>
          </Box>
        </div>
      </div>

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
                  }
                }}
              >
                <NoBorderTableCell align="center" component="th" scope="row" width={30}>
                  <Typography fontSize="14px" fontWeight={500} color="#79777f">
                    {idx + 1}
                  </Typography>
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
