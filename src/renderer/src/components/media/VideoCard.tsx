import React from "react";
import VideocamIcon from "@mui/icons-material/Videocam";
import { Box, Typography } from "@mui/material";
import type { Video } from "@features/library";
import { formatArtists } from "@utils/artist";
import { apiAssetUrl } from "@lib/axios";

interface VideoCardProps {
  video: Video;
  onClick: (video: Video) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const coverUrl = video.album?._id ? apiAssetUrl(`/album/${video.album._id}/cover`) : undefined;

  return (
    <Box sx={{ minWidth: 0 }}>
      <Box
        title={video.title}
        onClick={() => onClick(video)}
        sx={{
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
      <Typography noWrap fontWeight={750} sx={{ mt: 1.15, letterSpacing: "-.01em" }}>
        {video.title}
      </Typography>
      <Typography noWrap color="#9b9b9b" fontSize={13}>
        {formatArtists(video.artist)}
      </Typography>
    </Box>
  );
};
