import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlbumIcon from "@mui/icons-material/Album";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import { Avatar, Box, Button, Grid, Typography } from "@mui/material";
import { Album } from "../../core/Album";
import { AppAPI, appAPI } from "../../core/api";
import { Song } from "../../core/Song";
import { useAppDispatch } from "../../store/hook";
import { reset } from "../../store/player/playerSlice";
import { artistPath } from "../../utils/artist";

export const Home: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    Promise.all([appAPI.listAlbums(0, 12), appAPI.listSongs(0, 12)]).then(([albumData, songData]) => {
      setAlbums(albumData);
      setSongs(songData);
    });
  }, []);

  const featuredAlbum = albums[0];
  const heroArtist = featuredAlbum?.artist ?? songs[0]?.artist?.[0] ?? "Your library";
  const artistCount = useMemo(
    () =>
      new Set([
        ...albums.map((album) => album.artist),
        ...songs.flatMap((song) => song.artist ?? [])
      ]).size,
    [albums, songs]
  );

  const playRecent = () => {
    if (songs.length === 0) return;
    dispatch(reset({ songs, type: "audio" }));
  };

  const shuffleRecent = () => {
    if (songs.length === 0) return;
    dispatch(reset({ songs, shuffle: true, type: "audio" }));
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#000",
        color: "white",
        backgroundImage: featuredAlbum
          ? `linear-gradient(180deg, rgba(0,0,0,.18) 0%, #000 520px), linear-gradient(90deg, rgba(0,0,0,.96) 0%, rgba(0,0,0,.68) 48%, rgba(0,0,0,.25) 100%), url("${AppAPI.HOST}/album/${featuredAlbum._id}/cover")`
          : "linear-gradient(180deg, #141414 0%, #000 520px)",
        backgroundPosition: "center top",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        pt: "64px",
        pb: "120px"
      }}
    >
      <Box sx={{ px: { xs: 2, sm: 3, lg: 4 }, pt: { xs: 7, sm: 12 }, maxWidth: 1280 }}>
        <Typography
          sx={{
            color: "#a7a7a7",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            mb: 1.5
          }}
        >
          Home
        </Typography>
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: 38, sm: 56, md: 72 },
            lineHeight: 1,
            fontWeight: 800,
            maxWidth: 820
          }}
        >
          Listen deeper
        </Typography>
        <Typography sx={{ color: "#c9c9c9", fontSize: { xs: 15, sm: 17 }, mt: 2, maxWidth: 620 }}>
          Recent albums, top tracks, and artists from your private music collection.
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, mt: 3, flexWrap: "wrap" }}>
          <Button
            startIcon={<PlayArrowIcon />}
            variant="contained"
            onClick={playRecent}
            sx={{ bgcolor: "#fff", color: "#000", borderRadius: "999px", px: 3 }}
          >
            Play
          </Button>
          <Button
            startIcon={<ShuffleIcon />}
            variant="contained"
            onClick={shuffleRecent}
            sx={{ bgcolor: "rgba(255,255,255,.14)", borderRadius: "999px", px: 3 }}
          >
            Shuffle
          </Button>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3, lg: 4 }, mt: { xs: 7, sm: 10 } }}>
        <Grid container spacing={1.5} sx={{ mb: 5 }}>
          <Stat icon={<AlbumIcon />} label="Albums" value={albums.length} />
          <Stat icon={<MusicNoteIcon />} label="Tracks" value={songs.length} />
          <Stat icon={<QueueMusicIcon />} label="Artists" value={artistCount} />
        </Grid>

        <SectionHeader title="Featured albums" action="View all" onAction={() => navigate("/albums")} />
        <Grid container spacing={2.5}>
          {albums.map((album) => (
            <Grid key={album._id} item xs={6} sm={4} md={3} lg={2}>
              <AlbumTile album={album} />
            </Grid>
          ))}
        </Grid>

        <SectionHeader title="Artists to revisit" sx={{ mt: 5 }} />
        <Grid container spacing={1.5}>
          {[...new Set([heroArtist, ...albums.map((album) => album.artist)])].slice(0, 8).map((artist) => (
            <Grid key={artist} item xs={12} sm={6} md={4} lg={3}>
              <Box
                onClick={() => navigate(artistPath(artist))}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  bgcolor: "rgba(255,255,255,.055)",
                  border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: 1,
                  p: 1,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "rgba(255,255,255,.1)" }
                }}
              >
                <Avatar sx={{ bgcolor: "#222", color: "#fff", fontWeight: 700 }}>
                  {artist.slice(0, 1).toUpperCase()}
                </Avatar>
                <Typography noWrap fontWeight={700}>
                  {artist}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

function AlbumTile({ album }: { album: Album }): React.ReactElement {
  const navigate = useNavigate();
  return (
    <Box sx={{ minWidth: 0 }}>
      <Box
        onClick={() => navigate(`/album/${album._id}`)}
        title={album.title}
        sx={{
          aspectRatio: "1 / 1",
          borderRadius: 1,
          overflow: "hidden",
          bgcolor: "#151515",
          cursor: "pointer",
          boxShadow: "0 18px 48px rgba(0,0,0,.38)"
        }}
      >
        <Box
          component="img"
          src={`${AppAPI.HOST}/album/${album._id}/cover`}
          alt={album.title}
          sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </Box>
      <Typography noWrap fontWeight={700} sx={{ mt: 1 }}>
        {album.title}
      </Typography>
      <Typography noWrap color="#9b9b9b" fontSize={13}>
        {album.artist}
      </Typography>
    </Box>
  );
}

function SectionHeader({
  title,
  action,
  onAction,
  sx
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  sx?: object;
}): React.ReactElement {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, ...sx }}>
      <Typography component="h2" fontSize={24} fontWeight={800}>
        {title}
      </Typography>
      {action && (
        <Button onClick={onAction} sx={{ color: "#a7a7a7", fontWeight: 700 }}>
          {action}
        </Button>
      )}
    </Box>
  );
}

function Stat({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}): React.ReactElement {
  return (
    <Grid item xs={12} sm={4}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          bgcolor: "rgba(255,255,255,.075)",
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 1,
          px: 2,
          py: 1.5
        }}
      >
        <Box sx={{ display: "flex", color: "#fff" }}>{icon}</Box>
        <Box>
          <Typography fontSize={20} fontWeight={800} lineHeight={1}>
            {value}
          </Typography>
          <Typography color="#a7a7a7" fontSize={12} fontWeight={700} textTransform="uppercase">
            {label}
          </Typography>
        </Box>
      </Box>
    </Grid>
  );
}
