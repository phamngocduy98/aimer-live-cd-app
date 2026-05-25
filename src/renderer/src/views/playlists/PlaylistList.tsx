import React, { useEffect, useState } from "react";
import { Playlist } from "../../core/Playlist";
import { appAPI } from "../../core/api";
import { usePlaylistRefresh } from "../../contexts/PlaylistRefreshContext";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
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
    <div
      style={{
        background: "linear-gradient(180.04deg, rgba(12, 12, 12, 0.7) 0px, rgb(12, 12, 12) 99.96%)",
        minHeight: "100vh",
        paddingTop: "48px"
      }}
    >
      <div style={{ padding: "32px 24px 0px 24px" }}>
        <Typography component="div" fontSize={32} fontWeight={700}>
          Playlists
        </Typography>
        <Typography component="div" fontSize={16} color="text.secondary" sx={{ mt: 1 }}>
          {playlists.length} playlists
        </Typography>
      </div>

      <Box sx={{ p: "24px" }}>
        {playlists.length === 0 ? (
          <Typography color="text.secondary" sx={{ mt: 4, textAlign: "center" }}>
            No playlists yet. Create one from the sidebar.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {playlists.map((pl) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={pl._id}>
                <Card
                  sx={{
                    bgcolor: "#181818",
                    borderRadius: "6px",
                    "&:hover": { bgcolor: "#282828" }
                  }}
                >
                  <CardActionArea onClick={() => navigate(`/playlist/${pl._id}`)}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: 160,
                        bgcolor: "#242424",
                        m: 1,
                        borderRadius: "4px"
                      }}
                    >
                      <QueueMusicIcon sx={{ fontSize: 64, color: "#727272" }} />
                    </Box>
                    <CardContent sx={{ p: "8px 12px 12px" }}>
                      <Typography
                        noWrap
                        textOverflow="ellipsis"
                        fontSize={14}
                        fontWeight={600}
                        sx={{ mb: 0.5 }}
                      >
                        {pl.name}
                      </Typography>
                      <Typography fontSize={12} color="text.secondary">
                        {pl.songCount} songs
                      </Typography>
                      {pl.description && (
                        <Typography
                          noWrap
                          textOverflow="ellipsis"
                          fontSize={12}
                          color="text.secondary"
                          sx={{ mt: 0.25 }}
                        >
                          {pl.description}
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </div>
  );
};
