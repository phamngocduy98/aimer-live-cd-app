import React from "react";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { Playlist } from "@features/playlist";

interface PlaylistCardProps {
  playlist: Playlist;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist }) => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{ minWidth: 0, cursor: "pointer" }}
      onClick={() => navigate(`/playlist/${playlist._id}`)}
    >
      <Box
        sx={{
          aspectRatio: "1 / 1",
          borderRadius: 1.25,
          background:
            "radial-gradient(circle at 28% 22%, rgba(38,231,223,.26), transparent 35%), linear-gradient(135deg, #292929 0%, #0d0d0d 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 16px 36px rgba(0,0,0,.28)",
          border: "1px solid rgba(255,255,255,.06)",
          transition: "transform .22s ease, box-shadow .22s ease",
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: "0 22px 48px rgba(0,0,0,.48)"
          }
        }}
      >
        <QueueMusicIcon sx={{ fontSize: 64, color: "#e4fffd" }} />
      </Box>
      <Typography noWrap textOverflow="ellipsis" fontSize={14} fontWeight={700} sx={{ mt: 1 }}>
        {playlist.name}
      </Typography>
      <Typography fontSize={13} color="#a7a7a7">
        {playlist.songCount} songs
      </Typography>
      {playlist.description && (
        <Typography noWrap textOverflow="ellipsis" fontSize={12} color="#858585" sx={{ mt: 0.25 }}>
          {playlist.description}
        </Typography>
      )}
    </Box>
  );
};
