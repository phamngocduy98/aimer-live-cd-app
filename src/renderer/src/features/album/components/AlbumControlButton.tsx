import Grid from "@mui/material/Unstable_Grid2";
import { useAppDispatch } from "@app/hooks";
import { reset } from "@features/player/store/playerSlice";
import type { AlbumDetail } from "../types";
import { PlayShuffleActions } from "@components/view/PlayShuffleActions";

export const AlbumControlButton: React.FC<{ album: AlbumDetail }> = ({ album }) => {
  const dispatch = useAppDispatch();
  return (
    <Grid
      container
      spacing={2}
      sx={{ padding: { xs: "0 16px 16px 16px", sm: "0 28px 28px 28px" } }}
    >
      <Grid xs={12} sm={"auto"}>
        <PlayShuffleActions
          playAriaLabel="Play all"
          shuffleAriaLabel="Shuffle play"
          sx={{ mt: 0 }}
          onPlay={() => {
            if (album.trackList.length > 0) {
              dispatch(reset({ songs: album.trackList, type: "audio" }));
            } else {
              dispatch(reset({ songs: album.videoList, type: "video" }));
            }
          }}
          onShuffle={() => {
            if (album.trackList.length > 0) {
              dispatch(reset({ songs: album.trackList, shuffle: true, type: "audio" }));
            } else {
              dispatch(reset({ songs: album.videoList, shuffle: true, type: "video" }));
            }
          }}
        />
      </Grid>
    </Grid>
  );
};
