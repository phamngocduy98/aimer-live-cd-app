import React from "react";
import {
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
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
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { useAppSelector } from "@app/hooks";
import type { PlaySource } from "@features/player/types";
import { isCurrentSourceItem } from "@features/player/types";
import { mediaArtworkUrl } from "@utils/mediaArtwork";
import type { PlaylistItem } from "../types";
import { formatDuration } from "@utils/formatDuration";
import { ArtistLinks } from "@components/media/ArtistLinks";

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
                  display: { xs: "none", sm: "table-cell" },
                  "@media (max-width: 749.95px)": { display: "none" }
                }}
              >
                ARTIST
              </PlaylistTableCell>
              <PlaylistTableCell
                data-testid="playlist-album-column"
                sx={{ width: "24%", display: { xs: "none", lg: "table-cell" } }}
              >
                ALBUM
              </PlaylistTableCell>
              <PlaylistTableCell
                data-testid="playlist-time-column"
                align="center"
                sx={{ width: 72, display: { xs: "none", md: "table-cell" } }}
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
                    {active ? (
                      <VolumeUpIcon className="now-playing-accent" sx={{ width: 16, height: 16 }} />
                    ) : (
                      <Typography fontSize="14px" fontWeight={500} color="#79777f">
                        {index + 1}
                      </Typography>
                    )}
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
                        <Typography
                          className={active ? "now-playing-accent" : undefined}
                          noWrap
                          textOverflow="ellipsis"
                          sx={{
                            fontSize: { xs: 17, sm: 14 },
                            fontWeight: { xs: 400, sm: 750 }
                          }}
                        >
                          {item.media.title}
                        </Typography>
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
                      display: { xs: "none", sm: "table-cell" },
                      "@media (max-width: 749.95px)": { display: "none" }
                    }}
                  >
                    <ArtistLinks artists={item.media.artist} />
                  </PlaylistTableCell>
                  <PlaylistTableCell
                    data-testid="playlist-album-cell"
                    sx={{ display: { xs: "none", lg: "table-cell" } }}
                  >
                    <Typography noWrap textOverflow="ellipsis" fontSize={14} color="#a0a0a0">
                      {"album" in item.media
                        ? (item.media.album?.title ?? "Unknown")
                        : "Video"}
                    </Typography>
                  </PlaylistTableCell>
                  <PlaylistTableCell
                    data-testid="playlist-time-cell"
                    align="center"
                    sx={{ display: { xs: "none", md: "table-cell" } }}
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
      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem
          onClick={() => {
            if (menu) onRemove(menu.itemId);
            setMenu(null);
          }}
        >
          Remove from playlist
        </MenuItem>
      </Menu>
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
