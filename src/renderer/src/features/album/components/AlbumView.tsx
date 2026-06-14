import React from "react";
import { Box, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { AlbumShelf } from "@components/media/AlbumShelf";
import { PageScaffold } from "@components/view/PageScaffold";
import { useArtist } from "@features/artist/hooks/useArtist";
import { formatDuration } from "@utils/formatDuration";
import { apiAssetUrl } from "@lib/axios";
import { AlbumControlButton } from "./AlbumControlButton";
import { AlbumInfo } from "./AlbumInfo";
import { SongListTable } from "./SongListTable";
import { useAlbum } from "../hooks/useAlbum";
import { usePlayAlbum } from "../hooks/usePlayAlbum";
import { MediaDetailHero } from "@components/view/MediaDetailPage";
import { DetailContent } from "@components/view/designSystem";

export const AlbumView: React.FC = () => {
  const { id = "" } = useParams();
  const { data: album } = useAlbum(id);
  const { data: artistData } = useArtist(album?.artist ?? "");
  const playAlbum = usePlayAlbum();

  if (!album) {
    return <PageScaffold>{null}</PageScaffold>;
  }

  const trackDuration = album.trackList.reduce((total, track) => total + track.duration, 0);
  const relatedAlbums = (artistData?.albums ?? []).filter(
    (relatedAlbum) => relatedAlbum._id !== album._id
  );

  return (
    <PageScaffold sx={{ pt: "64px" }}>
      <MediaDetailHero
        backgroundImage={{
          xs: `linear-gradient(180deg, rgba(0,0,0,.08) 0%, rgba(0,0,0,.28) 40%, #000 100%), url("${apiAssetUrl(`/album/${album._id}/cover`)}")`,
          md: `linear-gradient(180deg, rgba(0,0,0,.2) 0%, rgba(0,0,0,.32) 54%, #000 100%), linear-gradient(90deg, rgba(0,0,0,.62), rgba(0,0,0,.08) 72%), url("${apiAssetUrl(`/album/${album._id}/cover`)}")`
        }}
      >
        <AlbumInfo album={album} />
        <AlbumControlButton album={album} />
      </MediaDetailHero>

      {album.trackList.length > 0 && (
        <DetailContent compactGutter sx={{ pt: { xs: 4, md: 2 } }}>
          <SongListTable album={album} />
          <Box
            sx={{
              px: { xs: 2.5, sm: 0 },
              pt: { xs: 5, sm: 3 },
              pb: 1,
              color: "#c8c8c8",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: ".085em",
              textTransform: "uppercase",
              lineHeight: 1.9
            }}
          >
            <Typography
              component="div"
              fontSize="inherit"
              fontWeight="inherit"
              letterSpacing="inherit"
            >
              Released {album.year} · {album.trackList.length} tracks (
              {formatDuration(trackDuration)})
            </Typography>
            {album.genre.length > 0 && (
              <Typography
                component="div"
                fontSize="inherit"
                fontWeight="inherit"
                letterSpacing="inherit"
              >
                Genre: {album.genre.join(", ")}
              </Typography>
            )}
          </Box>
        </DetailContent>
      )}

      <DetailContent sx={{ pt: { xs: 7, md: 8 } }}>
        <AlbumShelf
          title={`More Albums by ${album.artist}`}
          albums={relatedAlbums}
          onPlay={playAlbum}
          secondary="year"
        />
      </DetailContent>
    </PageScaffold>
  );
};
