import React from "react";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { Box, IconButton, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { Album } from "@features/library";
import { artistPath } from "@utils/artist";
import { apiAssetUrl } from "@lib/axios";
import { AlbumActionsMenu, type ActionMenuPosition } from "@components/media/MediaActionsMenu";

interface AlbumCardProps {
  album: Album;
  secondary?: "artist" | "year" | "none";
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album, secondary = "artist" }) => {
  const navigate = useNavigate();
  const [favorite, setFavorite] = React.useState(false);
  const [actionsPosition, setActionsPosition] = React.useState<ActionMenuPosition | null>(null);

  return (
    <Box sx={{ minWidth: 0 }}>
      <Box
        onClick={() => navigate(`/album/${album._id}`)}
        onContextMenu={(event) => {
          event.preventDefault();
          setActionsPosition({ top: event.clientY, left: event.clientX });
        }}
        title={album.title}
        sx={{
          position: "relative",
          aspectRatio: "1 / 1",
          borderRadius: 1.25,
          overflow: "hidden",
          bgcolor: "#151515",
          cursor: "pointer",
          boxShadow: "0 16px 36px rgba(0,0,0,.28)",
          transition: "transform .22s ease, box-shadow .22s ease",
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: "0 22px 48px rgba(0,0,0,.48)"
          },
          "&:hover img": {
            transform: "scale(1.04)"
          },
          "&:hover .media-card-actions": {
            opacity: 1,
            transform: "translateY(0)"
          }
        }}
      >
        <Box
          component="img"
          src={apiAssetUrl(`/album/${album._id}/cover`)}
          alt={album.title}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transition: "transform .25s ease"
          }}
        />
        <Box
          className="media-card-actions"
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            p: 1.25,
            background: "linear-gradient(180deg, transparent 48%, rgba(0,0,0,.72))",
            opacity: { xs: 1, sm: 0 },
            transform: { xs: "none", sm: "translateY(6px)" },
            transition: "opacity 160ms ease, transform 160ms ease",
            pointerEvents: "none"
          }}
        >
          <IconButton
            aria-label={`Play ${album.title}`}
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/album/${album._id}`);
            }}
            sx={{ bgcolor: "#fff", color: "#111", pointerEvents: "auto" }}
          >
            <PlayArrowRoundedIcon />
          </IconButton>
          <IconButton
            aria-label={`${favorite ? "Remove" : "Add"} ${album.title} ${
              favorite ? "from" : "to"
            } favorites`}
            onClick={(event) => {
              event.stopPropagation();
              setFavorite((value) => !value);
            }}
            sx={{ bgcolor: "rgba(0,0,0,.68)", color: "#fff", pointerEvents: "auto" }}
          >
            {favorite ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
          </IconButton>
        </Box>
      </Box>
      <Typography noWrap fontWeight={750} sx={{ mt: 1.15, letterSpacing: "-.01em" }}>
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
      <AlbumActionsMenu
        album={album}
        open={Boolean(actionsPosition)}
        anchorPosition={actionsPosition}
        onClose={() => setActionsPosition(null)}
      />
    </Box>
  );
};
