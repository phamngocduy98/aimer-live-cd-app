import React, { useEffect, useState } from "react";
import { AlbumDetail } from "../../core/Album";
import { AppAPI, appAPI } from "../../core/api";
import { Box } from "@mui/material";
import { useParams } from "react-router-dom";
import { AlbumInfo } from "./AlbumInfo";
import { SongListTable } from "./SongListTable";
import { AlbumControlButton } from "./AlbumControlButton";
import { VideoList } from "./VideoList";

export const AlbumView: React.FC = () => {
  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  const { id } = useParams();

  useEffect(() => {
    if (id == null) return;
    appAPI.album(id).then((al) => {
      al.trackList.forEach(
        (s) =>
          (s.album = {
            _id: al._id,
            artist: al.artist,
            title: al.title,
            cover: al.cover
          })
      );
      al.videoList.forEach(
        (s) =>
          (s.album = {
            _id: al._id,
            artist: al.artist,
            title: al.title,
            cover: al.cover
          })
      );
      setAlbum(al);
    });
  }, [id]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#000",
        color: "white",
        background: `linear-gradient(180deg, rgba(0,0,0,.24) 0%, #000 500px), linear-gradient(90deg, rgba(0,0,0,.9), rgba(0,0,0,.45)), url("${AppAPI.HOST}/album/${id}/cover") top/cover`,
        paddingTop: "64px",
        paddingBottom: "120px"
      }}
    >
      {album && (
        <>
          <AlbumInfo album={album} />
          <AlbumControlButton album={album} />
          <SongListTable album={album} />
          <VideoList album={album} />
        </>
      )}
    </Box>
  );
};
