import React, { useEffect, useState } from "react";
import { Album } from "../../core/Album";
import { AppAPI, appAPI } from "../../core/api";
import "./albums.css";

import { Box, Grid } from "@mui/material";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import { Song } from "../../core/Song";
import { shuffleArray } from "../../utils/shuffleArray";
import { useAppDispatch, useAppSelector } from "../../store/hook";
import { reset } from "../../store/player/playerSlice";

function AlbumItem({ album }: { album: Album }) {
  const navigate = useNavigate();
  const onClick = () => {
    navigate(`/album/${album._id}`);
  };
  return (
    <>
      <Card sx={{ minWidth: 140 }}>
        <CardMedia
          sx={{ paddingTop: "100%" }}
          image={`${AppAPI.HOST}/album/${album._id}/cover`}
          title={album.title}
          onClick={onClick}
        />
      </Card>
      <Typography gutterBottom variant="body1" component="div" textOverflow={"ellipsis"} noWrap>
        {album.title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {album.artist}
      </Typography>
    </>
  );
}

export const Albums: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  useEffect(() => {
    appAPI.listAlbums().then((al) => setAlbums(al));
  }, []);
  return (
    <div
      style={{
        background: `linear-gradient(180.04deg, rgba(12, 12, 12, 0.7) 0px, rgb(12, 12, 12) 99.96%), url("${
          AppAPI.HOST
        }/album/${albums.at(-1)?._id}/cover") top/cover`,
        display: "flex",
        flexDirection: "column"
      }}
    >
      <ArtistItem />
      <Grid container spacing={2} style={{ padding: "24px", background: "black" }}>
        {albums.map((album) => (
          <Grid key={album._id} item xs={6} sm={4} md={3} lg={2}>
            <AlbumItem album={album} />
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

function ArtistItem() {
  const dispatch = useAppDispatch();

  const onPlayAll = async () => {
    const songs = await appAPI.artistTopTracks("Aimer");
    dispatch(reset({ songs, type: "audio" }));
  };

  const onPlayShuffleAll = async () => {
    const songs = await appAPI.artistTopTracks("Aimer");
    dispatch(reset({ songs, shuffle: true, type: "audio" }));
  };

  return (
    <div style={{ marginBottom: 24, paddingTop: "20dvh" }}>
      <div style={{ display: "flex", padding: "32px 24px 0px 24px" }}>
        <Box sx={{ display: "flex", flexDirection: "column", zIndex: 1 }}>
          <CardContent sx={{ flex: "1 0 auto", padding: 0 }}>
            <Typography component="div" fontSize={32} fontWeight={700}>
              Aimer
            </Typography>
            <Typography component="div" fontSize={16} color="text.secondary">
              Favorite artist, idol of phamngocduy98
            </Typography>
          </CardContent>
        </Box>
      </div>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          columnGap: "16px",
          p: "0 24px 24px 24px"
        }}
      >
        <Button
          startIcon={<PlayArrowIcon />}
          variant="contained"
          aria-label="play"
          onClick={onPlayAll}
          size="large"
          style={{ textTransform: "none", backgroundColor: "white" }}
        >
          Play
        </Button>
        <Button
          startIcon={<ShuffleIcon />}
          variant="text"
          aria-label="play"
          onClick={onPlayShuffleAll}
          size="large"
          style={{
            textTransform: "none",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            color: "white"
          }}
        >
          Shuffle
        </Button>
      </Box>
    </div>
  );
}
