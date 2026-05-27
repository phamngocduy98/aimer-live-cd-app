import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { appAPI, SearchResult } from "../../core/api";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { tableCellClasses } from "@mui/material";
import styled from "@emotion/styled";

import { AppAPI } from "../../core/api";
import { useAppDispatch } from "../../store/hook";
import { reset } from "../../store/player/playerSlice";
import { formatDuration } from "../../utils/formatDuration";
import { SongBitDepth } from "../player/SongBitDepth";

export const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const q = searchParams.get("q") ?? "";
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) {
      setResult({ songs: [], albums: [], videos: [] });
      return;
    }
    setLoading(true);
    appAPI.search(q).then((data) => {
      setResult(data);
      setLoading(false);
    });
  }, [q]);

  return (
    <div
      style={{
        background: "linear-gradient(180.04deg, rgba(12, 12, 12, 0.7) 0px, rgb(12, 12, 12) 99.96%)",
        display: "flex",
        flexDirection: "column",
        paddingTop: "48px",
        minHeight: "100vh"
      }}
    >
      <div style={{ padding: "80px 24px 24px 24px" }}>
        <Typography component="div" fontSize={32} fontWeight={700}>
          Search results
        </Typography>
        {q && (
          <Typography component="div" fontSize={16} color="text.secondary">
            Results for &ldquo;{q}&rdquo;
          </Typography>
        )}
      </div>

      {loading && (
        <Box sx={{ p: "0 24px" }}>
          <Typography color="text.secondary">Searching...</Typography>
        </Box>
      )}

      {!loading &&
        result &&
        q &&
        !result.songs.length &&
        !result.albums.length &&
        !result.videos.length && (
          <Box sx={{ p: "0 24px" }}>
            <Typography color="text.secondary">No results found</Typography>
          </Box>
        )}

      {!loading && result && result.songs.length > 0 && (
        <Section title="Songs" count={result.songs.length}>
          <TableContainer sx={{ background: "black", px: { xs: 2, sm: 3 } }}>
            <Table size="small" aria-label="search songs table">
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
                </TableRow>
              </TableHead>
              <TableBody>
                {result.songs.map((track, idx) => (
                  <TableRow
                    hover
                    key={track._id}
                    onDoubleClick={() =>
                      dispatch(reset({ songs: [track], history: [], type: "audio" }))
                    }
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      cursor: "pointer"
                    }}
                  >
                    <NoBorderTableCell align="center" component="th" scope="row" width={30}>
                      <Typography fontSize="14px" fontWeight={500} color="#79777f">
                        {idx + 1}
                      </Typography>
                    </NoBorderTableCell>
                    <NoBorderTableCell>
                      <Typography noWrap textOverflow="ellipsis" fontSize="14px">
                        {track.title}
                      </Typography>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Section>
      )}

      {!loading && result && result.albums.length > 0 && (
        <Section title="Albums" count={result.albums.length}>
          <Grid container spacing={2} sx={{ px: 3 }}>
            {result.albums.map((album) => (
              <Grid key={album._id} item xs={6} sm={4} md={3} lg={2}>
                <Card sx={{ minWidth: 140 }}>
                  <CardMedia
                    sx={{ paddingTop: "100%", cursor: "pointer" }}
                    image={`${AppAPI.HOST}/album/${album._id}/cover`}
                    title={album.title}
                    onClick={() => navigate(`/album/${album._id}`)}
                  />
                </Card>
                <Typography
                  gutterBottom
                  variant="body1"
                  component="div"
                  textOverflow="ellipsis"
                  noWrap
                >
                  {album.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {album.artist}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Section>
      )}

      {!loading && result && result.videos.length > 0 && (
        <Section title="Videos" count={result.videos.length}>
          <TableContainer sx={{ background: "black", px: { xs: 2, sm: 3 }, overflowX: "auto" }}>
            <Table size="small" aria-label="search videos table" sx={{ tableLayout: "fixed" }}>
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
                {result.videos.map((track, idx) => (
                  <TableRow
                    hover
                    key={track._id}
                    onDoubleClick={() => dispatch(reset({ songs: [track], type: "video" }))}
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      cursor: "pointer"
                    }}
                  >
                    <NoBorderTableCell align="center" component="th" scope="row" width={30}>
                      <Typography fontSize="14px" fontWeight={500} color="#79777f">
                        {idx + 1}
                      </Typography>
                    </NoBorderTableCell>
                    <NoBorderTableCell>
                      <Typography noWrap textOverflow="ellipsis" fontSize="14px">
                        {track.title}
                      </Typography>
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
        </Section>
      )}
    </div>
  );
};

function Section({
  title,
  count,
  children
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ px: 3, mb: 1, display: "flex", alignItems: "baseline", gap: 1 }}>
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {count}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}

const NoBorderTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: { border: 0 },
  [`&.${tableCellClasses.body}`]: { border: 0 }
}));
