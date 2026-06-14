import React from "react";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { Playlist } from "@features/playlist";
import { MediaCard } from "./MediaCard";

interface PlaylistCardProps {
  playlist: Playlist;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist }) => {
  const navigate = useNavigate();

  return (
    <MediaCard
      title={playlist.name}
      onOpen={() => navigate(`/playlist/${playlist._id}`)}
      artwork={
        <Box
          sx={{
            width: "100%",
            height: "100%",
            background:
              "radial-gradient(circle at 28% 22%, rgba(38,231,223,.26), transparent 35%), linear-gradient(135deg, #292929 0%, #0d0d0d 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(255,255,255,.06)"
          }}
        >
          <QueueMusicIcon sx={{ fontSize: 64, color: "#e4fffd" }} />
        </Box>
      }
      secondary={
        <>
          <Typography fontSize={13} color="#a7a7a7">
            {playlist.itemCount} items
          </Typography>
          {playlist.description && (
            <Typography
              noWrap
              textOverflow="ellipsis"
              fontSize={12}
              color="#858585"
              sx={{ mt: 0.25 }}
            >
              {playlist.description}
            </Typography>
          )}
        </>
      }
    />
  );
};
