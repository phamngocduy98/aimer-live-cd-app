import React from "react";
import { Box } from "@mui/material";
import { useParams } from "react-router-dom";
import { AlbumInfo } from "./AlbumInfo";
import { SongListTable } from "./SongListTable";
import { AlbumControlButton } from "./AlbumControlButton";
import { VideoList } from "./VideoList";
import { useAlbum } from "../hooks/useAlbum";
import { apiAssetUrl } from "@lib/axios";

export const AlbumView: React.FC = () => {
  const { id = "" } = useParams();
  const { data: album } = useAlbum(id);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#000",
        color: "white",
        background: `linear-gradient(180deg, rgba(0,0,0,.24) 0%, #000 500px), linear-gradient(90deg, rgba(0,0,0,.9), rgba(0,0,0,.45)), url("${apiAssetUrl(`/album/${id}/cover`)}") top/cover`,
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
