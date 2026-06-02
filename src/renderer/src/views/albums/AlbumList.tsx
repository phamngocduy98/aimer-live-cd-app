import React, { useEffect, useState, useMemo } from "react";
import { Album } from "../../core/Album";
import { AppAPI, appAPI } from "../../core/api";
import "./albums.css";

import { Avatar, Box, Grid } from "@mui/material";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";

import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { artistPath } from "../../utils/artist";

function AlbumItem({ album }: { album: Album }) {
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
          boxShadow: "0 18px 44px rgba(0,0,0,.35)",
          "&:hover img": {
            transform: "scale(1.04)"
          }
        }}
      >
        <Box
          component="img"
          src={`${AppAPI.HOST}/album/${album._id}/cover`}
          alt={album.title}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transition: "transform .25s ease"
          }}
        />
      </Box>
      <Typography gutterBottom variant="body1" component="div" textOverflow="ellipsis" noWrap sx={{ mt: 1, fontWeight: 700 }}>
        {album.title}
      </Typography>
      <Typography
        variant="body2"
        color="#a7a7a7"
        noWrap
        sx={{
          "&:hover": {
            color: "#fff",
            textDecoration: "underline",
            cursor: "pointer"
          }
        }}
        onClick={() => navigate(artistPath(album.artist))}
      >
        {album.artist}
      </Typography>
    </Box>
  );
}

export const Albums: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  useEffect(() => {
    appAPI.listAlbums().then((al) => setAlbums(al));
  }, []);

  const groupedAlbums = useMemo(() => {
    return albums.reduce(
      (acc, album) => {
        const year = album.year ?? "Unknown";
        if (!acc[year]) acc[year] = [];
        acc[year].push(album);
        return acc;
      },
      {} as Record<string | number, Album[]>
    );
  }, [albums]);

  const sortedYears = useMemo(() => {
    return Object.keys(groupedAlbums).sort((a, b) => {
      if (a === "Unknown") return 1;
      if (b === "Unknown") return -1;
      return Number(b) - Number(a);
    });
  }, [groupedAlbums]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#000",
        color: "white",
        backgroundImage: albums.at(-1)
          ? `linear-gradient(180deg, rgba(0,0,0,.34) 0%, #000 420px), url("${AppAPI.HOST}/album/${albums.at(-1)?._id}/cover")`
          : "linear-gradient(180deg, #151515 0%, #000 420px)",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        pt: "64px",
        pb: "120px"
      }}
    >
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 8, sm: 12 }, pb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ width: 64, height: 64, borderRadius: 1, bgcolor: "rgba(255,255,255,.12)" }}>
            <MusicNoteIcon />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography color="#a7a7a7" fontSize={12} fontWeight={800} textTransform="uppercase">
              Collection
            </Typography>
            <Typography component="h1" sx={{ fontSize: { xs: 38, sm: 58 }, fontWeight: 900, lineHeight: 1 }}>
              Albums
            </Typography>
            <Typography color="#c9c9c9" sx={{ mt: 1 }}>
              {albums.length} albums in your library
            </Typography>
          </Box>
        </Box>
      </Box>
      <Grid container spacing={2.5} sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
        {sortedYears.map((year) => (
          <React.Fragment key={year}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ color: "#fff", mb: 1, fontWeight: 800 }}>
                {year}
              </Typography>
            </Grid>
            {groupedAlbums[year].map((album) => (
              <Grid key={album._id} item xs={6} sm={4} md={3} lg={2}>
                <AlbumItem album={album} />
              </Grid>
            ))}
          </React.Fragment>
        ))}
      </Grid>
    </Box>
  );
};
