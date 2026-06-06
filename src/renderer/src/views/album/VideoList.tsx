import { Box, Grid, Typography } from "@mui/material";
import { AlbumDetail } from "../../api/Album";
import { useAppDispatch } from "@app/hooks";
import { reset } from "@features/player/store/playerSlice";
import { VideoCard } from "../../components/media/VideoCard";

export const VideoList: React.FC<{ album: AlbumDetail }> = ({ album }) => {
  const dispatch = useAppDispatch();

  if (album.videoList.length === 0) return null;

  return (
    <Box sx={{ bgcolor: "#000", px: { xs: 2, sm: 3 }, py: 3 }}>
      <Typography component="h2" fontSize={22} fontWeight={800} sx={{ mb: 2 }}>
        Videos
      </Typography>
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
