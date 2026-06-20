import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@app/hooks";
import { hideView } from "@features/player/store/playerGuiSlice";
import { SongBitDepth } from "@features/player/components/SongBitDepth";
import { artistImageUrl, artistPath } from "@utils/artist";
import { formatDuration } from "@utils/formatDuration";
import { apiAssetUrl } from "@lib/axios";
import type { AlbumDetail } from "../types";
import { MediaDetailIdentity } from "@components/view/MediaDetailPage";

export const AlbumInfo: React.FC<{ album: AlbumDetail }> = ({ album }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const trackDuration = album.trackList.reduce((total, track) => total + track.duration, 0);

  const openArtist = () => {
    dispatch(hideView("mobilePlayer"));
    navigate(artistPath(album.artist));
  };

  return (
    <MediaDetailIdentity
      artwork={
        <Box component="img" src={apiAssetUrl(`/album/${album._id}/cover`)} alt={album.title} />
      }
      title={album.title}
      subtitle={
        <Box
          onClick={openArtist}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mt: 1,
            cursor: "pointer",
            "&:hover .artist-name": { textDecoration: "underline" }
          }}
        >
          <Box
            component="img"
            src={artistImageUrl(album.artist)}
            alt=""
            onError={(event: React.SyntheticEvent<HTMLImageElement>) => {
              if (event.currentTarget.src !== apiAssetUrl(`/album/${album._id}/cover`)) {
                event.currentTarget.src = apiAssetUrl(`/album/${album._id}/cover`);
              }
            }}
            sx={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              objectFit: "cover",
              border: "1px solid rgba(255,255,255,.26)"
            }}
          />
          <Typography className="artist-name" fontSize={16} fontWeight={600}>
            {album.artist}
          </Typography>
        </Box>
      }
      summary={
        <>
          <span>{album.trackList.length} tracks</span>
          <span>·</span>
          <span>{formatDuration(trackDuration)}</span>
        </>
      }
      badges={
        <>
          <Typography fontSize={13} fontWeight={700}>
            {album.year}
          </Typography>
          {album.trackList.length > 0 ? <SongBitDepth song={album.trackList[0]} /> : null}
        </>
      }
    />
  );
};
