import { Box, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { PageScaffold } from "@components/view/PageScaffold";
import { apiAssetUrl } from "@lib/axios";
import { useVideo } from "../hooks/useVideo";
import { MediaDetailHero } from "@components/view/MediaDetailPage";
import { DetailContent, PageState } from "@components/view/designSystem";
import { VideoChapterTable } from "./VideoChapterTable";
import { VideoControlButton } from "./VideoControlButton";
import { VideoInfo } from "./VideoInfo";

export function VideoView(): React.ReactElement {
  const { id = "" } = useParams();
  const { data: video, isLoading, isError } = useVideo(id);

  if (isLoading) {
    return (
      <PageScaffold>
        <PageState state="loading" />
      </PageScaffold>
    );
  }
  if (isError || !video) {
    return (
      <PageScaffold>
        <PageState state="error" message="Video not found" />
      </PageScaffold>
    );
  }

  const coverUrl = apiAssetUrl(`/video/${video._id}/cover`);

  return (
    <PageScaffold>
      <MediaDetailHero
        backgroundImage={{
          xs: `linear-gradient(180deg, rgba(0,0,0,.08) 0%, rgba(0,0,0,.28) 40%, #000 100%), url("${coverUrl}")`,
          md: `linear-gradient(180deg, rgba(0,0,0,.2) 0%, rgba(0,0,0,.32) 54%, #000 100%), linear-gradient(90deg, rgba(0,0,0,.62), rgba(0,0,0,.08) 72%), url("${coverUrl}")`
        }}
        fallbackBackground="radial-gradient(circle at 25% 20%, #40351e 0%, #17140d 38%, #000 100%)"
      >
        <VideoInfo video={video} />
        <VideoControlButton video={video} />
      </MediaDetailHero>

      <DetailContent compactGutter sx={{ pt: { xs: 4, md: 2 }, pb: 5 }}>
        <VideoChapterTable video={video} />
        <Box
          sx={{
            px: { xs: 2.5, sm: 0 },
            pt: { xs: 5, sm: 3 },
            pb: 1,
            color: "#c8c8c8",
            fontSize: 11,
            fontWeight: 700,
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
            Released {video.year ?? "Unknown"} · {video.chapters.length} chapters
          </Typography>
          {video.genre && video.genre.length > 0 && (
            <Typography
              component="div"
              fontSize="inherit"
              fontWeight="inherit"
              letterSpacing="inherit"
            >
              Genre: {video.genre.join(", ")}
            </Typography>
          )}
        </Box>
      </DetailContent>
    </PageScaffold>
  );
}
