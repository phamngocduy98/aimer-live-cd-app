import React from "react";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Playlist } from "../../core/Playlist";

interface PlaylistCardProps {
  playlist: Playlist;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist }) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minWidth: 0, cursor: "pointer" }} onClick={() => navigate(`/playlist/${playlist._id}`)}>
      <Box
        sx={{
          aspectRatio: "1 / 1",
          borderRadius: 1,
          background: "linear-gradient(135deg, #2c2c2c 0%, #111 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 18px 44px rgba(0,0,0,.35)",
          border: "1px solid rgba(255,255,255,.06)",
          "&:hover": { background: "linear-gradient(135deg, #383838 0%, #151515 100%)" }
        }}
      >
        <QueueMusicIcon sx={{ fontSize: 64, color: "#bdbdbd" }} />
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
