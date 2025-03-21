import React, { useEffect, useState } from "react";
import { AlbumDetail } from "../../core/Album";
import { AppAPI, appAPI } from "../../core/api";

import { TextField } from "@mui/material";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { useNavigate, useParams } from "react-router-dom";

import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";

import { useAppDispatch, useAppSelector } from "../../store/hook";
import { AlbumInfo } from "./AlbumInfo";
import { SongListTable } from "./SongListTable";
import { AlbumControlButton } from "./AlbumControlButton";
import { VideoList } from "./VideoList";

export const AlbumView: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { playingTrack } = useAppSelector((state) => state.player);
  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  let { id } = useParams();

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
    <div
      style={{
        background: `linear-gradient(180.04deg, rgba(12, 12, 12, 0.7) 0px, rgb(12, 12, 12) 99.96%), url("${AppAPI.HOST}/album/${id}/cover") top/cover`,
        paddingTop: "48px"
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
    </div>
  );
};
