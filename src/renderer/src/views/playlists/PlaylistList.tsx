import React, { useEffect, useState } from "react";
import { Playlist } from "../../core/Playlist";
import { appAPI } from "../../core/api";
import { usePlaylistRefresh } from "../../contexts/PlaylistRefreshContext";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import { MediaHero } from "../../components/view/MediaHero";
import { PageScaffold } from "../../components/view/PageScaffold";
import { PlaylistCard } from "../../components/media/PlaylistCard";

export const Playlists: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { refreshKey } = usePlaylistRefresh();

  useEffect(() => {
    appAPI.listPlaylists().then(setPlaylists);
  }, [refreshKey]);

  return (
    <PageScaffold background="linear-gradient(180deg, #171717 0%, #000 430px)">
      <MediaHero
        eyebrow="Collection"
        title="Playlists"
        subtitle={`${playlists.length} playlists`}
        icon={<QueueMusicIcon />}
      />

      <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
        {playlists.length === 0 ? (
          <Typography color="#a7a7a7" sx={{ mt: 4, textAlign: "center" }}>
            No playlists yet. Create one from the sidebar.
          </Typography>
        ) : (
          <Grid container spacing={2.5}>
            {playlists.map((pl) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={pl._id}>
                <PlaylistCard playlist={pl} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </PageScaffold>
  );
};
