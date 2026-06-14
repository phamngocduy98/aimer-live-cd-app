import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { PageScaffold } from "@components/view/PageScaffold";
import { ArtistLinks } from "@components/media/ArtistLinks";
import { NOW_PLAYING_BACKGROUND, NOW_PLAYING_COLOR } from "@components/media/nowPlayingStyles";
import { apiAssetUrl } from "@lib/axios";
import { formatDuration } from "@utils/formatDuration";
import { playVideoChapter } from "@features/player/thunks/playVideoChapter";
import { useVideo } from "../hooks/useVideo";
import { MediaDetailHero, MediaDetailIdentity } from "@components/view/MediaDetailPage";
import {
  DetailActions,
  DetailContent,
  PageState,
  PrimaryActionGroup
} from "@components/view/designSystem";

export function VideoView() {
  const { id = "" } = useParams();
  const dispatch = useAppDispatch();
  const { data: video, isLoading, isError } = useVideo(id);
  const playingTrack = useAppSelector((state) => state.player.playingTrack);
  const currentChapterIdx = useAppSelector((state) => state.player.currentChapterIdx);

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

  const playSource = {
    type: "video" as const,
    id: video._id,
    label: video.title,
    route: `/video/${video._id}`
  };
  const isCurrentVideo = playingTrack?._id === video._id;
  const coverUrl = apiAssetUrl(`/video/${video._id}/cover`);

  return (
    <PageScaffold sx={{ pt: "64px" }}>
      <MediaDetailHero
        backgroundImage={{
          xs: `linear-gradient(180deg, rgba(0,0,0,.08) 0%, rgba(0,0,0,.28) 40%, #000 100%), url("${coverUrl}")`,
          md: `linear-gradient(180deg, rgba(0,0,0,.2) 0%, rgba(0,0,0,.32) 54%, #000 100%), linear-gradient(90deg, rgba(0,0,0,.62), rgba(0,0,0,.08) 72%), url("${coverUrl}")`
        }}
        fallbackBackground="radial-gradient(circle at 25% 20%, #40351e 0%, #17140d 38%, #000 100%)"
      >
        <MediaDetailIdentity
          artwork={
            <Box component="img" src={coverUrl} alt={video.title} />
          }
          title={video.title}
          subtitle={<ArtistLinks artists={video.artist} color="#fff" fontSize={16} />}
          summary={
            <>
              <span>{video.chapters.length} chapters</span>
              <span>·</span>
              <span>{formatDuration(video.duration)}</span>
            </>
          }
        />
        <DetailActions
          primary={
            <PrimaryActionGroup
              onPlay={() => dispatch(playVideoChapter(video, playSource, 0))}
              showShuffle={false}
              playAriaLabel="Play"
            />
          }
          secondaryColumns={0}
        />
      </MediaDetailHero>

      <DetailContent compactGutter sx={{ py: 5 }}>
        <Typography
          component="h2"
          sx={{ px: { xs: 1, sm: 0 }, mb: 2, fontSize: 26, fontWeight: 850 }}
        >
          Chapters
        </Typography>
        <TableContainer>
          <Table aria-label="video chapters table">
            <TableHead>
              <TableRow>
                <TableCell width={64}>#</TableCell>
                <TableCell>Title</TableCell>
                <TableCell align="right">Start</TableCell>
                <TableCell align="right">Duration</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {video.chapters.map((chapter, index) => {
                const active = isCurrentVideo && currentChapterIdx === index;
                const end = video.chapters[index + 1]?.time ?? video.duration;
                return (
                  <TableRow
                    hover
                    key={`${chapter.time}-${index}`}
                    aria-current={active ? "true" : undefined}
                    onClick={() => dispatch(playVideoChapter(video, playSource, index))}
                    sx={{
                      cursor: "pointer",
                      bgcolor: active ? NOW_PLAYING_BACKGROUND : undefined
                    }}
                  >
                    <TableCell sx={{ color: active ? NOW_PLAYING_COLOR : "text.secondary" }}>
                      {active ? <VolumeUpIcon fontSize="small" /> : index + 1}
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={750} color={active ? NOW_PLAYING_COLOR : "inherit"}>
                        {chapter.title}
                      </Typography>
                      {chapter.subTitle && (
                        <Typography color="text.secondary" fontSize={13}>
                          {chapter.subTitle}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">{formatDuration(chapter.time)}</TableCell>
                    <TableCell align="right">
                      {formatDuration(Math.max(0, end - chapter.time))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </DetailContent>
    </PageScaffold>
  );
}
