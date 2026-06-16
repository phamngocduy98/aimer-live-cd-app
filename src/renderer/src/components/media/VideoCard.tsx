import React from "react";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import VideocamIcon from "@mui/icons-material/Videocam";
import { Box, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { Video } from "@features/library";
import { ArtistLinks } from "./ArtistLinks";
import { MediaCard } from "./MediaCard";
import { mediaArtworkUrl } from "@utils/mediaArtwork";

interface VideoCardProps {
  video: Video;
  onPlay: (video: Video) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onPlay }) => {
  const navigate = useNavigate();
  const coverUrl = mediaArtworkUrl(video);
  const [favorite, setFavorite] = React.useState(false);

  return (
    <MediaCard
      title={video.title}
      aspect="landscape"
      onOpen={() => navigate(`/video/${video._id}`)}
      onPlay={() => onPlay(video)}
      artwork={
        coverUrl ? (
          <Box component="img" src={coverUrl} alt={video.title} />
        ) : (
          <VideocamIcon sx={{ fontSize: 44, color: "#bdbdbd" }} />
        )
      }
      trailingAction={
        <IconButton
          aria-label={`${favorite ? "Remove" : "Add"} ${video.title} ${
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
      secondary={<ArtistLinks artists={video.artist} color="#9b9b9b" fontSize={13} />}
    />
  );
};
