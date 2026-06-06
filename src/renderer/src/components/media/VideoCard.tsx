import React from "react";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import VideocamIcon from "@mui/icons-material/Videocam";
import { Box, IconButton, Typography } from "@mui/material";
import type { Video } from "@features/library";
import { formatArtists } from "@utils/artist";
import { apiAssetUrl } from "@lib/axios";

interface VideoCardProps {
  video: Video;
  onClick: (video: Video) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const coverUrl = video.album?._id ? apiAssetUrl(`/album/${video.album._id}/cover`) : undefined;
  const [favorite, setFavorite] = React.useState(false);

  return (
    <Box sx={{ minWidth: 0 }}>
      <Box
        title={video.title}
        onClick={() => onClick(video)}
        sx={{
          position: "relative",
          aspectRatio: "16 / 9",
          borderRadius: 1.25,
          overflow: "hidden",
          bgcolor: "#151515",
          cursor: "pointer",
          boxShadow: "0 16px 36px rgba(0,0,0,.28)",
          transition: "transform .22s ease, box-shadow .22s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          "&:hover img": {
            transform: "scale(1.04)"
          },
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: "0 22px 48px rgba(0,0,0,.48)"
          },
          "&:hover .media-card-actions": {
            opacity: 1,
            transform: "translateY(0)"
          }
        }}
      >
        {coverUrl ? (
          <Box
            component="img"
            src={coverUrl}
            alt={video.title}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transition: "transform .25s ease"
            }}
          />
        ) : (
          <VideocamIcon sx={{ fontSize: 44, color: "#bdbdbd" }} />
        )}
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
            aria-label={`Play ${video.title}`}
            onClick={(event) => {
              event.stopPropagation();
              onClick(video);
            }}
            sx={{ bgcolor: "#fff", color: "#111", pointerEvents: "auto" }}
          >
            <PlayArrowRoundedIcon />
          </IconButton>
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
        </Box>
      </Box>
      <Typography noWrap fontWeight={750} sx={{ mt: 1.15, letterSpacing: "-.01em" }}>
        {video.title}
      </Typography>
      <Typography noWrap color="#9b9b9b" fontSize={13}>
        {formatArtists(video.artist)}
      </Typography>
    </Box>
  );
};
