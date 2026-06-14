import React from "react";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import { Box, IconButton, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { Album } from "@features/library";
import { apiAssetUrl } from "@lib/axios";
import { AlbumActionsMenu, type ActionMenuPosition } from "@components/media/MediaActionsMenu";
import { ArtistLinks } from "./ArtistLinks";
import { MediaCard } from "./MediaCard";

interface AlbumCardProps {
  album: Album;
  secondary?: "artist" | "year" | "none";
  onPlay: (album: Album) => void;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album, secondary = "artist", onPlay }) => {
  const navigate = useNavigate();
  const [favorite, setFavorite] = React.useState(false);
  const [actionsPosition, setActionsPosition] = React.useState<ActionMenuPosition | null>(null);

  return (
    <>
      <MediaCard
        title={album.title}
        aspect="square"
        onOpen={() => navigate(`/album/${album._id}`)}
        onPlay={() => onPlay(album)}
        onContextMenu={(event) => {
          event.preventDefault();
          setActionsPosition({ top: event.clientY, left: event.clientX });
        }}
        artwork={
          <Box component="img" src={apiAssetUrl(`/album/${album._id}/cover`)} alt={album.title} />
        }
        trailingAction={
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
        }
        secondary={
          <>
            {secondary === "artist" && (
              <ArtistLinks artists={album.artist} color="#9b9b9b" fontSize={13} />
            )}
            {secondary === "year" && (
              <Typography noWrap color="#9b9b9b" fontSize={13}>
                {album.year ?? ""}
              </Typography>
            )}
          </>
        }
      />
      <AlbumActionsMenu
        album={album}
        open={Boolean(actionsPosition)}
        anchorPosition={actionsPosition}
        onClose={() => setActionsPosition(null)}
      />
    </>
  );
};
