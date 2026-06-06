import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { IconButton } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { toggleFavorite } from "../store/playerSlice";

interface FavoriteButtonProps {
  size?: number;
}

export function FavoriteButton({ size = 24 }: FavoriteButtonProps) {
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
      sx={{ flexShrink: 0 }}
    >
      {favorite ? (
        <FavoriteIcon sx={{ fontSize: size }} />
      ) : (
        <FavoriteBorderIcon sx={{ fontSize: size }} />
      )}
    </IconButton>
  );
}
