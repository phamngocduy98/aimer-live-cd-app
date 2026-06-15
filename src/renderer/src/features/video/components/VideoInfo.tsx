import { Box, Typography } from "@mui/material";
import { MediaDetailIdentity } from "@components/view/MediaDetailPage";
import { ArtistLinks } from "@components/media/ArtistLinks";
import { VideoBitDepth } from "@features/player/components/SongBitDepth";
import { apiAssetUrl } from "@lib/axios";
import { artistImageUrl, getPrimaryArtist } from "@utils/artist";
import { formatDuration } from "@utils/formatDuration";
import type { Video } from "@features/library";

export function VideoInfo({ video }: { video: Video }): React.ReactElement {
  const coverUrl = apiAssetUrl(`/video/${video._id}/cover`);
  const primaryArtist = getPrimaryArtist(video.artist);

  return (
    <MediaDetailIdentity
      artwork={<Box component="img" src={coverUrl} alt={video.title} />}
      title={video.title}
      subtitle={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            component="img"
            src={artistImageUrl(primaryArtist)}
            alt=""
            onError={(event: React.SyntheticEvent<HTMLImageElement>) => {
              if (event.currentTarget.src !== coverUrl) {
                event.currentTarget.src = coverUrl;
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
          <ArtistLinks artists={video.artist} color="#fff" fontSize={16} fontWeight={800} />
        </Box>
      }
      summary={
        <>
          <span>{video.chapters.length} chapters</span>
          <span>·</span>
          <span>{formatDuration(video.duration)}</span>
        </>
      }
      badges={
        <>
          {video.year && (
            <Typography fontSize={13} fontWeight={850}>
              {video.year}
            </Typography>
          )}
          <VideoBitDepth video={video} />
        </>
      }
    />
  );
}
