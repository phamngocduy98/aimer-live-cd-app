import { Box, Grid } from "@mui/material";
import type { AlbumDetail } from "../types";
import { useAppDispatch } from "@app/hooks";
import { playContext } from "@features/player/store/playerSlice";
import { VideoCard } from "@components/media/VideoCard";
import { SectionHeader } from "@components/view/SectionHeader";

export const VideoList: React.FC<{ album: AlbumDetail }> = ({ album }) => {
  const dispatch = useAppDispatch();

  if (album.videoList.length === 0) return null;
  const playSource = {
    type: "album" as const,
    id: album._id,
    label: album.title,
    route: `/album/${album._id}`
  };

  return (
    <Box sx={{ maxWidth: 1180, mx: "auto", px: { xs: 2.5, sm: 4, lg: 6 }, py: 5 }}>
      <SectionHeader title="Videos" />
      <Grid container spacing={2.5}>
        {album.videoList.map((vid, idx) => (
          <Grid key={vid._id} item xs={6} sm={4} md={3} lg={2}>
            <VideoCard
              video={vid}
              onClick={() =>
                dispatch(
                  playContext({
                    items: album.videoList,
                    playFrom: playSource,
                    startIndex: idx
                  })
                )
              }
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
