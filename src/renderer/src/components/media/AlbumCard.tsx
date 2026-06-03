import React from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Album } from "../../api/Album";
import { AppAPI } from "../../api/api";
import { artistPath } from "../../utils/artist";

interface AlbumCardProps {
  album: Album;
  secondary?: "artist" | "year" | "none";
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album, secondary = "artist" }) => {
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
      <Typography noWrap fontWeight={700} sx={{ mt: 1 }}>
        {album.title}
      </Typography>
      {secondary === "artist" && (
        <Typography
          noWrap
          color="#9b9b9b"
          fontSize={13}
          sx={{
            "&:hover": {
              color: "#fff",
              cursor: "pointer",
              textDecoration: "underline"
            }
          }}
          onClick={() => navigate(artistPath(album.artist))}
        >
          {album.artist}
        </Typography>
      )}
      {secondary === "year" && (
        <Typography noWrap color="#9b9b9b" fontSize={13}>
          {album.year ?? ""}
        </Typography>
      )}
    </Box>
  );
};
