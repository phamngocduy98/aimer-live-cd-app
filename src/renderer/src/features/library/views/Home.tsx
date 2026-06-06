import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AlbumIcon from "@mui/icons-material/Album";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import { Avatar, Box, Grid, Typography } from "@mui/material";
import { AlbumCard } from "@components/media/AlbumCard";
import { PageScaffold } from "@components/view/PageScaffold";
import { PlayShuffleActions } from "@components/view/PlayShuffleActions";
import { SectionHeader } from "@components/view/SectionHeader";
import { StatTile } from "@components/view/StatTile";
import { useAppDispatch } from "@app/hooks";
import { reset } from "@features/player/store/playerSlice";
import { artistPath } from "@utils/artist";
import { apiAssetUrl } from "@lib/axios";
import { useAlbums, useSongs } from "../hooks/useLibrary";

export const Home: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: albums = [] } = useAlbums(0, 12);
  const { data: songs = [] } = useSongs(0, 12);

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
    <PageScaffold
      backgroundImage={
        featuredAlbum
          ? `linear-gradient(180deg, rgba(0,0,0,.18) 0%, #000 520px), linear-gradient(90deg, rgba(0,0,0,.96) 0%, rgba(0,0,0,.68) 48%, rgba(0,0,0,.25) 100%), url("${apiAssetUrl(`/album/${featuredAlbum._id}/cover`)}")`
          : "linear-gradient(180deg, #141414 0%, #000 520px)"
      }
    >
      <Box
        sx={{
          px: { xs: 2.5, sm: 4, lg: 6 },
          pt: { xs: 7, sm: 12 },
          maxWidth: 1440,
          mx: "auto"
        }}
      >
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
        <PlayShuffleActions onPlay={playRecent} onShuffle={shuffleRecent} />
      </Box>

      <Box
        sx={{
          px: { xs: 2.5, sm: 4, lg: 6 },
          mt: { xs: 7, sm: 10 },
          maxWidth: 1440,
          mx: "auto"
        }}
      >
        <Grid container spacing={1.5} sx={{ mb: 5 }}>
          <StatTile icon={<AlbumIcon />} label="Albums" value={albums.length} />
          <StatTile icon={<MusicNoteIcon />} label="Tracks" value={songs.length} />
          <StatTile icon={<QueueMusicIcon />} label="Artists" value={artistCount} />
        </Grid>

        <SectionHeader
          title="Featured albums"
          action="View all"
          onAction={() => navigate("/albums")}
        />
        <Grid container spacing={2.5}>
          {albums.map((album) => (
            <Grid key={album._id} item xs={6} sm={4} md={3} lg={2}>
              <AlbumCard album={album} />
            </Grid>
          ))}
        </Grid>

        <SectionHeader title="Artists to revisit" sx={{ mt: 5 }} />
        <Grid container spacing={1.5}>
          {[...new Set([heroArtist, ...albums.map((album) => album.artist)])]
            .slice(0, 8)
            .map((artist) => (
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
    </PageScaffold>
  );
};
