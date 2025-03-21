import { Card, CardMedia, Grid, Typography } from "@mui/material";
import { AlbumDetail } from "../../core/Album";
import { Video } from "../../core/Video";
import { useAppDispatch, useAppSelector } from "../../store/hook";
import { AppAPI } from "../../core/api";
import { reset } from "../../store/player/playerSlice";

export const VideoList: React.FC<{ album: AlbumDetail }> = ({ album }) => {
  const dispatch = useAppDispatch();
  const { playingTrack } = useAppSelector((state) => state.player);

  return (
    <>
      <Grid container spacing={2} style={{ padding: "24px", background: "black" }}>
        {album.videoList.map((vid, idx) => (
          <Grid key={album._id} item xs={6} sm={4} md={3} lg={2}>
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
    </>
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
    <>
      <Card sx={{ minWidth: 140 }}>
        <CardMedia
          sx={{ paddingTop: "100%" }}
          image={`${AppAPI.HOST}/album/${album._id}/cover`}
          title={album.title}
          onClick={() => onClick(video)}
        />
      </Card>
      <Typography gutterBottom variant="body1" component="div" textOverflow={"ellipsis"} noWrap>
        {video.title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {video.artist}
      </Typography>
    </>
  );
}
