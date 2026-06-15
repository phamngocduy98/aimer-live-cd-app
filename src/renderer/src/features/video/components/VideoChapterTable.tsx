import React from "react";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { Box, IconButton, TableBody, TableRow, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { ArtistLinks } from "@components/media/ArtistLinks";
import { SongActionsMenu } from "@components/media/MediaActionsMenu";
import {
  MediaTable,
  MediaTableCell,
  MediaTableHead,
  MediaTableRow
} from "@components/media/MediaTable";
import type { Video } from "@features/library";
import { playVideoChapter } from "@features/player/thunks/playVideoChapter";
import { formatDuration } from "@utils/formatDuration";

export function VideoChapterTable({ video }: { video: Video }): React.ReactElement {
  const dispatch = useAppDispatch();
  const playingTrack = useAppSelector((state) => state.player.playingTrack);
  const currentChapterIdx = useAppSelector((state) => state.player.currentChapterIdx);
  const [actionsAnchor, setActionsAnchor] = React.useState<HTMLElement | null>(null);
  const playSource = {
    type: "video" as const,
    id: video._id,
    label: video.title,
    route: `/video/${video._id}`
  };
  const isCurrentVideo = playingTrack?._id === video._id;

  return (
    <MediaTable
      ariaLabel="video chapters table"
      after={
        <SongActionsMenu
          track={video}
          anchorEl={actionsAnchor}
          open={Boolean(actionsAnchor)}
          onClose={() => setActionsAnchor(null)}
        />
      }
    >
      <MediaTableHead>
        <TableRow>
          <MediaTableCell align="center" width={30}>
            #
          </MediaTableCell>
          <MediaTableCell>TITLE</MediaTableCell>
          <MediaTableCell>ARTIST</MediaTableCell>
          <MediaTableCell align="center">TIME</MediaTableCell>
          <MediaTableCell align="center" width={44}></MediaTableCell>
        </TableRow>
      </MediaTableHead>
      <TableBody>
        {video.chapters.map((chapter, index) => {
          const active = isCurrentVideo && currentChapterIdx === index;
          const end = video.chapters[index + 1]?.time ?? video.duration;
          return (
            <MediaTableRow
              hover
              key={`${chapter.time}-${index}`}
              selected={active}
              aria-current={active ? "true" : undefined}
              onClick={() => dispatch(playVideoChapter(video, playSource, index))}
              sx={{ cursor: "pointer" }}
            >
              <MediaTableCell align="center" component="th" scope="row" width={30}>
                {active ? (
                  <VolumeUpIcon className="now-playing-accent" sx={{ width: 16, height: 16 }} />
                ) : (
                  <Typography fontSize={14} fontWeight={500} color="#79777f">
                    {index + 1}
                  </Typography>
                )}
              </MediaTableCell>
              <MediaTableCell>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    className={active ? "now-playing-accent" : undefined}
                    noWrap
                    fontSize={{ xs: 17, sm: 14 }}
                    fontWeight={750}
                  >
                    {chapter.title}
                  </Typography>
                  {chapter.subTitle && (
                    <Typography noWrap color="text.secondary" fontSize={{ xs: 15, sm: 13 }}>
                      {chapter.subTitle}
                    </Typography>
                  )}
                </Box>
              </MediaTableCell>
              <MediaTableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                <ArtistLinks artists={video.artist} />
              </MediaTableCell>
              <MediaTableCell align="center" sx={{ display: { xs: "none", sm: "table-cell" } }}>
                <Typography fontSize={14} color="#919191">
                  {formatDuration(Math.max(0, end - chapter.time))}
                </Typography>
              </MediaTableCell>
              <MediaTableCell align="center" width={44}>
                <IconButton
                  size="small"
                  aria-label="More actions"
                  onClick={(event) => {
                    event.stopPropagation();
                    setActionsAnchor(event.currentTarget);
                  }}
                >
                  <MoreHorizIcon fontSize="medium" />
                </IconButton>
              </MediaTableCell>
            </MediaTableRow>
          );
        })}
      </TableBody>
    </MediaTable>
  );
}
