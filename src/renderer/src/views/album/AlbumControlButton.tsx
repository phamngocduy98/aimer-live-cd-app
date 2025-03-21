import { Button } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import { useAppDispatch } from "../../store/hook";
import { reset } from "../../store/player/playerSlice";
import { shuffleArray } from "../../utils/shuffleArray";
import { AlbumDetail } from "../../core/Album";

export const AlbumControlButton: React.FC<{ album: AlbumDetail }> = ({ album }) => {
  const dispatch = useAppDispatch();
  return (
    <Grid
      container
      spacing={2}
      sx={{ padding: { xs: "0 16px 16px 16px", sm: "0 28px 28px 28px" } }}
    >
      <Grid
        xs={6}
        sm={"auto"}
        display="flex"
        justifyContent="center"
        alignItems="center"
        columnGap={"8px"}
      >
        <Button
          startIcon={<PlayArrowIcon />}
          variant="contained"
          aria-label="play"
          onClick={() => {
            if (album.trackList.length > 0) {
              dispatch(reset({ songs: album.trackList, type: "audio" }));
            } else {
              dispatch(reset({ songs: album.videoList, type: "video" }));
            }
          }}
          size="large"
          fullWidth
          style={{
            textTransform: "none",
            backgroundColor: "white"
          }}
        >
          Play
        </Button>
      </Grid>
      <Grid
        xs={6}
        sm={"auto"}
        display="flex"
        justifyContent="center"
        alignItems="center"
        columnGap={"8px"}
      >
        <Button
          startIcon={<ShuffleIcon />}
          variant="text"
          aria-label="play"
          onClick={() => {
            if (album.trackList.length > 0) {
              dispatch(reset({ songs: album.trackList, shuffle: true, type: "audio" }));
            } else {
              dispatch(reset({ songs: album.videoList, shuffle: true, type: "video" }));
            }
          }}
          size="large"
          fullWidth
          style={{
            textTransform: "none",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            color: "white"
          }}
        >
          Shuffle
        </Button>
      </Grid>
    </Grid>
  );
};
