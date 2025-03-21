import Grid from "@mui/material/Unstable_Grid2";
import { AppAPI } from "../../core/api";
import { Album, AlbumDetail } from "../../core/Album";
import { Avatar, Box, Typography, TypographyProps, TypographyTypeMap } from "@mui/material";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { formatDuration } from "../../utils/formatDuration";
import { useAppDispatch } from "../../store/hook";
import styled from "@emotion/styled";
import { ComponentProps } from "react";
import { SongBitDepth, VideoBitDepth } from "../player/SongBitDepth";
import { Block } from "@mui/icons-material";
import { router } from "../../router";
import { hideView } from "../../store/player/playerGuiSlice";

export const AlbumInfo: React.FC<{ album: AlbumDetail }> = ({ album }) => {
  const dispatch = useAppDispatch();
  return (
    <Grid
      container
      spacing={2}
      sx={{
        padding: { xs: "16px", sm: "28px" },
        cursor: "default",
        userSelect: "none"
      }}
    >
      <Grid xs={12} sm={"auto"} display="flex" justifyContent="center" alignItems="center">
        <Avatar
          sx={{
            borderRadius: "3px",
            height: { xs: 148, sm: 240 },
            width: { xs: 148, sm: 240 }
          }}
          src={`${AppAPI.HOST}/album/${album._id}/cover`}
        >
          <MusicNoteIcon />
        </Avatar>
      </Grid>
      <Grid
        xs={12}
        sm
        display="flex"
        flexDirection={"column"}
        justifyContent="center"
        sx={{ alignItems: { xs: "center", sm: "start" } }}
      >
        <Typography
          component="div"
          fontWeight={700}
          sx={{
            fontSize: { xs: 20, sm: 32 },
            width: "100%",
            textAlign: { xs: "center", sm: "start" }
          }}
          noWrap
          textOverflow="ellipsis"
        >
          {album.title}
        </Typography>
        <Typography
          variant="subtitle1"
          color="text.secondary"
          component="div"
          fontSize={14}
          sx={{
            pt: "8px",
            "&:hover": {
              textDecoration: "underline",
              cursor: "pointer"
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            dispatch(hideView("mobilePlayer"));
            router.navigate(`/`);
          }}
        >
          {album.artist}
        </Typography>
        <SubInfoTg
          sx={{
            display: { xs: "none", sm: "block" },
            marginTop: { xs: 0, sm: "24px" }
          }}
        >
          {album.trackList.length} TRACKS (
          {formatDuration(album.trackList.reduce((pre, t) => pre + t.duration, 0))}) /{" "}
          {album.videoList.length} VIDEOS (
          {formatDuration(album.videoList.reduce((pre, t) => pre + t.duration, 0))})
        </SubInfoTg>
        <Box
          display={"flex"}
          alignItems={"center"}
          justifyContent={"center"}
          sx={{ marginTop: "14px" }}
          columnGap={"8px"}
        >
          <SubInfoTg>{album.year}</SubInfoTg>
          {album.trackList.length > 0 ? <SongBitDepth song={album.trackList[0]} /> : null}
          {album.videoList.length > 0 ? <VideoBitDepth video={album.videoList[0]} /> : null}
        </Box>
      </Grid>
    </Grid>
  );
};

const SubInfoTg = styled((props: ComponentProps<typeof Typography>) => (
  // @ts-ignore
  <Typography {...props} variant="subtitle1" color="text.secondary" component="div" />
))(() => ({
  fontSize: "10px",
  lineHeight: "16px",
  letterSpacing: "1.2px",
  fontWeight: 600
}));
