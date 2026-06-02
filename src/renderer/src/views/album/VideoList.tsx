import { Box, Grid, Typography } from "@mui/material";
import { AlbumDetail } from "../../core/Album";
import { Video } from "../../core/Video";
import { useAppDispatch } from "../../store/hook";
import { AppAPI } from "../../core/api";
import { reset } from "../../store/player/playerSlice";
import { formatArtists } from "../../utils/artist";

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
            <VideoItem
              album={album}
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

function VideoItem({
  album,
  video,
  onClick
}: {
  album: AlbumDetail;
  video: Video;
  onClick: (vid: Video) => any;
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Box
        title={album.title}
        onClick={() => onClick(video)}
        sx={{
          aspectRatio: "16 / 9",
          borderRadius: 1,
          overflow: "hidden",
          bgcolor: "#151515",
          cursor: "pointer",
          boxShadow: "0 18px 44px rgba(0,0,0,.35)"
        }}
      >
        <Box
          component="img"
          src={`${AppAPI.HOST}/album/${album._id}/cover`}
          alt={video.title}
          sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </Box>
      <Typography gutterBottom variant="body1" component="div" textOverflow="ellipsis" noWrap sx={{ mt: 1, fontWeight: 700 }}>
        {video.title}
      </Typography>
      <Typography variant="body2" color="#a7a7a7" noWrap>
        {formatArtists(video.artist)}
      </Typography>
    </Box>
  );
}
