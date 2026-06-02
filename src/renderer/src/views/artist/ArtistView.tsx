import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AlbumIcon from "@mui/icons-material/Album";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { Avatar, Box, Button, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, tableCellClasses } from "@mui/material";
import styled from "@emotion/styled";
import { Album } from "../../core/Album";
import { AppAPI, appAPI } from "../../core/api";
import { Song } from "../../core/Song";
import { useAppDispatch, useAppSelector } from "../../store/hook";
import { reset } from "../../store/player/playerSlice";
import { formatArtists } from "../../utils/artist";
import { formatDuration } from "../../utils/formatDuration";
import { SongBitDepth } from "../player/SongBitDepth";

export const ArtistView: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { name } = useParams();
  const artistName = decodeURIComponent(name ?? "");
  const { playingTrack } = useAppSelector((state) => state.player);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);

  useEffect(() => {
    if (!artistName) return;
    Promise.all([appAPI.artistTopTracks(artistName), appAPI.listAlbums(0, 100)]).then(
      ([trackData, albumData]) => {
        setSongs(trackData);
        setAlbums(albumData.filter((album) => album.artist === artistName));
      }
    );
  }, [artistName]);

  const heroAlbum = albums[0] ?? songs.find((song) => song.album)?.album;
  const totalDuration = useMemo(
    () => songs.reduce((total, song) => total + song.duration, 0),
    [songs]
  );

  const playAll = () => {
    if (songs.length === 0) return;
    dispatch(reset({ songs, type: "audio" }));
  };

  const shuffleAll = () => {
    if (songs.length === 0) return;
    dispatch(reset({ songs, shuffle: true, type: "audio" }));
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#000",
        color: "white",
        backgroundImage: heroAlbum
          ? `linear-gradient(180deg, rgba(0,0,0,.18) 0%, #000 500px), linear-gradient(90deg, rgba(0,0,0,.95), rgba(0,0,0,.46)), url("${AppAPI.HOST}/album/${heroAlbum._id}/cover")`
          : "linear-gradient(180deg, #151515 0%, #000 500px)",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        pt: "64px",
        pb: "120px"
      }}
    >
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 8, sm: 14 }, pb: 3 }}>
        <Typography color="#a7a7a7" fontSize={12} fontWeight={800} textTransform="uppercase">
          Artist
        </Typography>
        <Typography
          component="h1"
          sx={{ fontSize: { xs: 42, sm: 64, md: 84 }, lineHeight: 1, fontWeight: 900, mt: 1 }}
        >
          {artistName || "Unknown artist"}
        </Typography>
        <Typography color="#c9c9c9" sx={{ mt: 2 }}>
          {songs.length} tracks / {albums.length} albums / {formatDuration(totalDuration)}
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, mt: 3, flexWrap: "wrap" }}>
          <Button
            startIcon={<PlayArrowIcon />}
            variant="contained"
            onClick={playAll}
            sx={{ bgcolor: "#fff", color: "#000", borderRadius: "999px", px: 3 }}
          >
            Play
          </Button>
          <Button
            startIcon={<ShuffleIcon />}
            variant="contained"
            onClick={shuffleAll}
            sx={{ bgcolor: "rgba(255,255,255,.14)", borderRadius: "999px", px: 3 }}
          >
            Shuffle
          </Button>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        <SectionTitle icon={<MusicNoteIcon />} title="Top tracks" />
        <TableContainer sx={{ bgcolor: "rgba(0,0,0,.72)", borderRadius: 1 }}>
          <Table size="small" aria-label="artist songs table">
            <TableHead sx={{ display: { xs: "none", sm: "table-header-group" } }}>
              <TableRow>
                <NoBorderTableCell align="center" width={36}>
                  #
                </NoBorderTableCell>
                <NoBorderTableCell>TITLE</NoBorderTableCell>
                <NoBorderTableCell>ALBUM</NoBorderTableCell>
                <NoBorderTableCell align="center">QUALITY</NoBorderTableCell>
                <NoBorderTableCell align="center">TIME</NoBorderTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {songs.map((song, idx) => (
                <TableRow
                  hover
                  key={song._id}
                  selected={song._id === playingTrack?._id}
                  onDoubleClick={() =>
                    dispatch(
                      reset({
                        songs: songs.slice(idx),
                        history: songs.slice(0, idx),
                        type: "audio"
                      })
                    )
                  }
                  sx={{ "&.Mui-selected": { bgcolor: "rgba(255,255,255,.12)" } }}
                >
                  <NoBorderTableCell align="center" component="th" scope="row">
                    {song._id === playingTrack?._id ? (
                      <VolumeUpIcon sx={{ width: 16, height: 16 }} />
                    ) : (
                      <Typography fontSize={14} color="#8f8f8f">
                        {idx + 1}
                      </Typography>
                    )}
                  </NoBorderTableCell>
                  <NoBorderTableCell>
                    <Typography noWrap fontSize={14} fontWeight={600}>
                      {song.title}
                    </Typography>
                    <Typography
                      noWrap
                      fontSize={13}
                      color="#9b9b9b"
                      sx={{ display: { xs: "block", sm: "none" } }}
                    >
                      {song.album?.title ?? formatArtists(song.artist)}
                    </Typography>
                  </NoBorderTableCell>
                  <NoBorderTableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                    <Typography
                      noWrap
                      color="#a0a0a0"
                      fontSize={14}
                      sx={{ "&:hover": { color: "#fff", textDecoration: "underline", cursor: "pointer" } }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (song.album?._id) navigate(`/album/${song.album._id}`);
                      }}
                    >
                      {song.album?.title ?? "Unknown"}
                    </Typography>
                  </NoBorderTableCell>
                  <NoBorderTableCell align="center" sx={{ display: { xs: "none", sm: "table-cell" } }}>
                    <SongBitDepth song={song} />
                  </NoBorderTableCell>
                  <NoBorderTableCell align="center" sx={{ display: { xs: "none", sm: "table-cell" } }}>
                    <Typography fontSize={14} color="#9b9b9b">
                      {formatDuration(song.duration)}
                    </Typography>
                  </NoBorderTableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
        <SectionTitle icon={<AlbumIcon />} title="Albums" />
        <Grid container spacing={2.5}>
          {albums.map((album) => (
            <Grid key={album._id} item xs={6} sm={4} md={3} lg={2}>
              <Box onClick={() => navigate(`/album/${album._id}`)} sx={{ cursor: "pointer" }}>
                <Avatar
                  src={`${AppAPI.HOST}/album/${album._id}/cover`}
                  variant="square"
                  sx={{ width: "100%", height: "auto", aspectRatio: "1 / 1", borderRadius: 1, mb: 1 }}
                />
                <Typography noWrap fontWeight={700}>
                  {album.title}
                </Typography>
                <Typography color="#9b9b9b" fontSize={13}>
                  {album.year ?? ""}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }): React.ReactElement {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
      <Box sx={{ display: "flex", color: "#fff" }}>{icon}</Box>
      <Typography component="h2" fontSize={22} fontWeight={800}>
        {title}
      </Typography>
    </Box>
  );
}

const NoBorderTableCell = styled(TableCell)(() => ({
  [`&.${tableCellClasses.head}`]: { border: 0, color: "#9b9b9b", fontSize: 12 },
  [`&.${tableCellClasses.body}`]: { border: 0 }
}));
