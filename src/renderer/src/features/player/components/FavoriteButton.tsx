import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { IconButton, type SxProps, type Theme } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import type { ReactElement } from "react";
import { toggleFavorite } from "../store/playerSlice";

interface FavoriteButtonProps {
  size?: number;
  buttonSize?: number;
  sx?: SxProps<Theme>;
}

export function FavoriteButton({ size = 24, buttonSize, sx }: FavoriteButtonProps): ReactElement {
  const dispatch = useAppDispatch();
  const { playingTrack, favoriteTrackIds } = useAppSelector((state) => state.player);
  const favorite = Boolean(playingTrack && favoriteTrackIds.includes(playingTrack._id));

  return (
    <IconButton
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={favorite}
      onClick={(event) => {
        event.stopPropagation();
        if (playingTrack) dispatch(toggleFavorite({ trackId: playingTrack._id }));
      }}
      sx={[
        { flexShrink: 0, ...(buttonSize ? { width: buttonSize, height: buttonSize } : {}) },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    >
      {favorite ? (
        <FavoriteIcon sx={{ fontSize: size }} />
      ) : (
        <FavoriteBorderIcon sx={{ fontSize: size }} />
      )}
    </IconButton>
  );
}
