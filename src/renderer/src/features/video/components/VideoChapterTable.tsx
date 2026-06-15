import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  tableCellClasses
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import type { Video } from "@features/library";
import { playVideoChapter } from "@features/player/thunks/playVideoChapter";
import { formatDuration } from "@utils/formatDuration";

export function VideoChapterTable({ video }: { video: Video }): React.ReactElement {
  const dispatch = useAppDispatch();
  const playingTrack = useAppSelector((state) => state.player.playingTrack);
  const currentChapterIdx = useAppSelector((state) => state.player.currentChapterIdx);
  const playSource = {
    type: "video" as const,
    id: video._id,
    label: video.title,
    route: `/video/${video._id}`
  };
  const isCurrentVideo = playingTrack?._id === video._id;

  return (
    <TableContainer
      sx={{
        background: "transparent",
        padding: { xs: "6px 8px", sm: "8px 0" },
        cursor: "default",
        userSelect: "none"
      }}
    >
      <Table
        size="small"
        aria-label="video chapters table"
        sx={{ tableLayout: { xs: "fixed", sm: "auto" } }}
      >
        <TableHead sx={{ display: { xs: "none", sm: "table-header-group" } }}>
          <TableRow>
            <NoBorderTableCell align="center" width={30}>
              #
            </NoBorderTableCell>
            <NoBorderTableCell>TITLE</NoBorderTableCell>
            <NoBorderTableCell align="center">START</NoBorderTableCell>
            <NoBorderTableCell align="center">TIME</NoBorderTableCell>
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
                sx={(theme) => ({
                  cursor: "pointer",
                  transition: `background-color ${theme.design.motion.fast}`,
                  "&:hover": { backgroundColor: theme.design.color.surfaceHover },
                  "&:last-child td, &:last-child th": { border: 0 },
                  "& th": {
                    borderTopLeftRadius: theme.design.radius.row,
                    borderBottomLeftRadius: theme.design.radius.row
                  },
                  "& td:last-child": {
                    borderTopRightRadius: theme.design.radius.row,
                    borderBottomRightRadius: theme.design.radius.row
                  },
                  ...(active && {
                    backgroundColor: theme.design.color.nowPlayingBackground,
                    "& .now-playing-accent": { color: theme.design.color.nowPlaying }
                  })
                })}
              >
                <NoBorderTableCell align="center" component="th" scope="row" width={30}>
                  {active ? (
                    <VolumeUpIcon className="now-playing-accent" sx={{ width: 16, height: 16 }} />
                  ) : (
                    <Typography fontSize={14} fontWeight={500} color="#79777f">
                      {index + 1}
                    </Typography>
                  )}
                </NoBorderTableCell>
                <NoBorderTableCell>
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
                </NoBorderTableCell>
                <NoBorderTableCell
                  align="center"
                  sx={{ display: { xs: "none", sm: "table-cell" } }}
                >
                  <Typography fontSize={14} color="#919191">
                    {formatDuration(chapter.time)}
                  </Typography>
                </NoBorderTableCell>
                <NoBorderTableCell
                  align="center"
                  sx={{ display: { xs: "none", sm: "table-cell" } }}
                >
                  <Typography fontSize={14} color="#919191">
                    {formatDuration(Math.max(0, end - chapter.time))}
                  </Typography>
                </NoBorderTableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const NoBorderTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    border: 0,
    color: theme.design.color.textMuted,
    fontSize: 12
  },
  [`&.${tableCellClasses.body}`]: {
    border: 0
  }
}));
