import { Box, Grid } from "@mui/material";
import type { AlbumDetail } from "../types";
import { useAppDispatch } from "@app/hooks";
import { reset } from "@features/player/store/playerSlice";
import { VideoCard } from "@components/media/VideoCard";
import { SectionHeader } from "@components/view/SectionHeader";

export const VideoList: React.FC<{ album: AlbumDetail }> = ({ album }) => {
  const dispatch = useAppDispatch();

  if (album.videoList.length === 0) return null;

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
                  reset({
                    songs: album.videoList.slice(idx),
                    history: album.videoList.slice(0, idx),
                    type: "video"
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
