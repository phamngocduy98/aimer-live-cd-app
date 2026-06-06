import { Box, Typography } from "@mui/material";
import { useAppDispatch } from "@app/hooks";
import { hideView } from "@features/player/store/playerGuiSlice";
import { SongBitDepth, VideoBitDepth } from "@features/player/components/SongBitDepth";
import { router } from "@app/router";
import { artistPath } from "@utils/artist";
import { formatDuration } from "@utils/formatDuration";
import { apiAssetUrl } from "@lib/axios";
import type { AlbumDetail } from "../types";

export const AlbumInfo: React.FC<{ album: AlbumDetail }> = ({ album }) => {
  const dispatch = useAppDispatch();
  const trackDuration = album.trackList.reduce((total, track) => total + track.duration, 0);
  const videoDuration = album.videoList.reduce((total, video) => total + video.duration, 0);

  const openArtist = () => {
    dispatch(hideView("mobilePlayer"));
    router.navigate(artistPath(album.artist));
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "center", md: "center" },
        justifyContent: { md: "flex-start" },
        gap: { xs: 2.5, md: 4 },
        textAlign: { xs: "center", md: "left" }
      }}
    >
      <Box
        component="img"
        src={apiAssetUrl(`/album/${album._id}/cover`)}
        alt={album.title}
        sx={{
          width: { xs: 218, sm: 240, md: 250 },
          aspectRatio: "1 / 1",
          borderRadius: 1.5,
          objectFit: "cover",
          bgcolor: "#181818",
          boxShadow: "0 28px 80px rgba(0,0,0,.58)",
          flexShrink: 0
        }}
      />

      <Box
        sx={{
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: { xs: "center", md: "flex-start" },
          maxWidth: 760
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: 31, sm: 42, md: 48 },
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-.035em",
            textShadow: "0 2px 24px rgba(0,0,0,.55)"
          }}
        >
          {album.title}
        </Typography>

        <Box
          onClick={openArtist}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mt: 2,
            cursor: "pointer",
            "&:hover .artist-name": { textDecoration: "underline" }
          }}
        >
          <Box
            component="img"
            src={apiAssetUrl(`/album/${album._id}/cover`)}
            alt=""
            sx={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              objectFit: "cover",
              border: "1px solid rgba(255,255,255,.26)"
            }}
          />
          <Typography className="artist-name" fontSize={16} fontWeight={800}>
            {album.artist}
          </Typography>
        </Box>

        <Typography
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            flexWrap: "wrap",
            gap: 0.75,
            mt: 2.25,
            color: "rgba(255,255,255,.78)",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: ".075em",
            textTransform: "uppercase"
          }}
        >
          <span>{album.trackList.length} tracks</span>
          <span>·</span>
          <span>{formatDuration(trackDuration)}</span>
          {album.videoList.length > 0 && (
            <>
              <span>·</span>
              <span>
                {album.videoList.length} videos ({formatDuration(videoDuration)})
              </span>
            </>
          )}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
          <Typography fontSize={13} fontWeight={850}>
            {album.year}
          </Typography>
          {album.trackList.length > 0 ? <SongBitDepth song={album.trackList[0]} /> : null}
          {album.videoList.length > 0 ? <VideoBitDepth video={album.videoList[0]} /> : null}
        </Box>
      </Box>
    </Box>
  );
};
