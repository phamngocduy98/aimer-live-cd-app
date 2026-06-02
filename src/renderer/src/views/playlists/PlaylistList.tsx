import React, { useEffect, useState } from "react";
import { Playlist } from "../../core/Playlist";
import { appAPI } from "../../core/api";
import { usePlaylistRefresh } from "../../contexts/PlaylistRefreshContext";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import { useNavigate } from "react-router-dom";

export const Playlists: React.FC = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { refreshKey } = usePlaylistRefresh();

  useEffect(() => {
    appAPI.listPlaylists().then(setPlaylists);
  }, [refreshKey]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#000",
        color: "white",
        background: "linear-gradient(180deg, #171717 0%, #000 430px)",
        pt: "64px",
        pb: "120px"
      }}
    >
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 8, sm: 12 }, pb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: { xs: 72, sm: 96 },
              height: { xs: 72, sm: 96 },
              borderRadius: 1,
              bgcolor: "rgba(255,255,255,.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <QueueMusicIcon sx={{ fontSize: { xs: 36, sm: 52 }, color: "#d6d6d6" }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography color="#a7a7a7" fontSize={12} fontWeight={800} textTransform="uppercase">
              Collection
            </Typography>
            <Typography component="h1" sx={{ fontSize: { xs: 38, sm: 58 }, fontWeight: 900, lineHeight: 1 }}>
              Playlists
            </Typography>
            <Typography component="div" fontSize={16} color="#c9c9c9" sx={{ mt: 1 }}>
              {playlists.length} playlists
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
        {playlists.length === 0 ? (
          <Typography color="#a7a7a7" sx={{ mt: 4, textAlign: "center" }}>
            No playlists yet. Create one from the sidebar.
          </Typography>
        ) : (
          <Grid container spacing={2.5}>
            {playlists.map((pl) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={pl._id}>
                <Box
                  onClick={() => navigate(`/playlist/${pl._id}`)}
                  sx={{
                    minWidth: 0,
                    cursor: "pointer"
                  }}
                >
                  <Box
                    sx={{
                      aspectRatio: "1 / 1",
                      borderRadius: 1,
                      bgcolor: "linear-gradient(135deg, #292929, #111)",
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
                    {pl.name}
                  </Typography>
                  <Typography fontSize={13} color="#a7a7a7">
                    {pl.songCount} songs
                  </Typography>
                  {pl.description && (
                    <Typography noWrap textOverflow="ellipsis" fontSize={12} color="#858585" sx={{ mt: 0.25 }}>
                      {pl.description}
                    </Typography>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};
