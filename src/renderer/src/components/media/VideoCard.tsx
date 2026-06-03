import React from "react";
import VideocamIcon from "@mui/icons-material/Videocam";
import { Box, Typography } from "@mui/material";
import { AppAPI } from "../../core/api";
import { Video } from "../../core/Video";
import { formatArtists } from "../../utils/artist";

interface VideoCardProps {
  video: Video;
  onClick: (video: Video) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const coverUrl = video.album?._id ? `${AppAPI.HOST}/album/${video.album._id}/cover` : undefined;

  return (
    <Box sx={{ minWidth: 0 }}>
      <Box
        title={video.title}
        onClick={() => onClick(video)}
        sx={{
          aspectRatio: "16 / 9",
          borderRadius: 1,
          overflow: "hidden",
          bgcolor: "#151515",
          cursor: "pointer",
          boxShadow: "0 18px 44px rgba(0,0,0,.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          "&:hover img": {
            transform: "scale(1.04)"
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
      </Box>
      <Typography noWrap fontWeight={700} sx={{ mt: 1 }}>
        {video.title}
      </Typography>
      <Typography noWrap color="#9b9b9b" fontSize={13}>
        {formatArtists(video.artist)}
      </Typography>
    </Box>
  );
};
