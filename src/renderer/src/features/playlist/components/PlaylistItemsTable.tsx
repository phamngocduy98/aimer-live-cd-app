import React from "react";
import {
  Avatar,
  Box,
  IconButton,
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
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import { useAppSelector } from "@app/hooks";
import type { PlaySource } from "@features/player/types";
import { isCurrentSourceItem } from "@features/player/types";
import { mediaArtworkUrl } from "@utils/mediaArtwork";
import type { PlaylistItem } from "../types";
import { formatDuration } from "@utils/formatDuration";
import { ArtistLinks } from "@components/media/ArtistLinks";
import { ResponsiveActionMenu } from "@components/common/ResponsiveActionMenu";
import {
  SongTableIndexCell,
  SongTableTitleText,
  songTableBodyColumnDisplay,
  songTableHeadColumnDisplay
} from "@components/media/SongTableShared";

interface PlaylistItemsTableProps {
  items: PlaylistItem[];
  playSource: PlaySource;
  onPlay: (index: number) => void;
  onRemove: (itemId: string) => void;
}

export function PlaylistItemsTable({
  items,
  playSource,
  onPlay,
  onRemove
}: PlaylistItemsTableProps): React.ReactElement {
  const currentEntry = useAppSelector((state) => state.player.currentEntry);
  const [menu, setMenu] = React.useState<{ anchor: HTMLElement; itemId: string } | null>(null);

  return (
    <>
      <TableContainer
        data-testid="playlist-table-container"
        sx={{
          background: "transparent",
          padding: { xs: "6px 8px", sm: "8px 0" },
          cursor: "default",
          userSelect: "none",
          overflowX: "hidden"
        }}
      >
        <Table
          size="small"
          aria-label="playlist items table"
          sx={{ width: "100%", tableLayout: "fixed" }}
        >
          <TableHead sx={{ display: { xs: "none", sm: "table-header-group" } }}>
            <TableRow>
              <PlaylistTableCell align="center" width={30}>
                #
              </PlaylistTableCell>
              <PlaylistTableCell>TITLE</PlaylistTableCell>
              <PlaylistTableCell
                data-testid="playlist-artist-column"
                sx={{
                  width: "24%",
                  display: songTableBodyColumnDisplay.artist
                }}
              >
                ARTIST
              </PlaylistTableCell>
              <PlaylistTableCell
                data-testid="playlist-album-column"
                sx={{ width: "24%", display: songTableHeadColumnDisplay.detail }}
              >
                ALBUM
              </PlaylistTableCell>
              <PlaylistTableCell
                data-testid="playlist-time-column"
                align="center"
                sx={{ width: 72, display: songTableHeadColumnDisplay.metadata }}
              >
                TIME
              </PlaylistTableCell>
              <PlaylistTableCell align="center" width={44} />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => {
              const active = isCurrentSourceItem(currentEntry, playSource, item.media, item._id);
              return (
                <TableRow
                  hover
                  selected={active}
                  key={item._id}
                  onDoubleClick={() => onPlay(index)}
                  sx={(theme) => ({
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
                    "&.Mui-selected": {
                      bgcolor: theme.design.color.nowPlayingBackground,
                      "& .now-playing-accent": { color: theme.design.color.nowPlaying }
                    }
                  })}
                >
                  <PlaylistTableCell align="center" component="th" scope="row" width={30}>
                    <SongTableIndexCell active={active}>{index + 1}</SongTableIndexCell>
                  </PlaylistTableCell>
                  <PlaylistTableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                      <Avatar
                        variant="rounded"
                        src={mediaArtworkUrl(item.media)}
                        sx={{
                          width: { xs: 42, sm: 44 },
                          height: { xs: 42, sm: 44 },
                          bgcolor: "#181818",
                          flexShrink: 0
                        }}
                      >
                        {item.mediaType === "video" && <OndemandVideoIcon />}
                      </Avatar>
                      <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <SongTableTitleText active={active}>{item.media.title}</SongTableTitleText>
                        <Box
                          sx={{
                            display: { xs: "flex", sm: "none" },
                            alignItems: "center",
                            gap: 0.75,
                            minWidth: 0
                          }}
                        >
                          {item.mediaType === "video" && (
                            <OndemandVideoIcon sx={{ fontSize: 16, flexShrink: 0 }} />
                          )}
                          <ArtistLinks
                            artists={item.media.artist}
                            color="#f2f2f2"
                            fontSize={15}
                            fontWeight={400}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </PlaylistTableCell>
                  <PlaylistTableCell
                    data-testid="playlist-artist-cell"
                    sx={{
                      display: songTableBodyColumnDisplay.artist
                    }}
                  >
                    <ArtistLinks artists={item.media.artist} />
                  </PlaylistTableCell>
                  <PlaylistTableCell
                    data-testid="playlist-album-cell"
                    sx={{ display: songTableBodyColumnDisplay.detail }}
                  >
                    <Typography noWrap textOverflow="ellipsis" fontSize={14} color="#a0a0a0">
                      {"album" in item.media ? (item.media.album?.title ?? "Unknown") : "Video"}
                    </Typography>
                  </PlaylistTableCell>
                  <PlaylistTableCell
                    data-testid="playlist-time-cell"
                    align="center"
                    sx={{ display: songTableBodyColumnDisplay.metadata }}
                  >
                    <Typography fontSize={14} color="#919191">
                      {formatDuration(item.media.duration)}
                    </Typography>
                  </PlaylistTableCell>
                  <PlaylistTableCell align="center" width={44} sx={{ whiteSpace: "nowrap" }}>
                    <IconButton
                      size="small"
                      aria-label={`${item.media.title} actions`}
                      onClick={(event) =>
                        setMenu({ anchor: event.currentTarget, itemId: item._id })
                      }
                    >
                      <MoreHorizIcon fontSize="medium" />
                    </IconButton>
                  </PlaylistTableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <ResponsiveActionMenu
        anchorEl={menu?.anchor}
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
        ariaLabel="Playlist item actions"
        items={[
          {
            label: "Remove from playlist",
            onClick: () => {
              if (menu) onRemove(menu.itemId);
            }
          }
        ]}
      />
    </>
  );
}

const PlaylistTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    border: 0,
    color: theme.design.color.textMuted,
    fontSize: 12
  },
  [`&.${tableCellClasses.body}`]: {
    border: 0
  }
}));
