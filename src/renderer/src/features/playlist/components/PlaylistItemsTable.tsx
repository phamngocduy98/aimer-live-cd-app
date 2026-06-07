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
  TableRow,
  Typography
} from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { apiAssetUrl } from "@lib/axios";
import { useAppSelector } from "@app/hooks";
import type { PlaySource } from "@features/player/types";
import { isCurrentSourceItem } from "@features/player/types";
import type { PlaylistItem } from "../types";
import { formatDuration } from "@utils/formatDuration";

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
}: PlaylistItemsTableProps) {
  const currentEntry = useAppSelector((state) => state.player.currentEntry);
  const [menu, setMenu] = React.useState<{ anchor: HTMLElement; itemId: string } | null>(null);

  return (
    <>
      <TableContainer>
        <Table size="small" aria-label="playlist items table">
          <TableBody>
            {items.map((item, index) => {
              const active = isCurrentSourceItem(currentEntry, playSource, item.media, item._id);
              return (
                <TableRow
                  hover
                  selected={active}
                  key={item._id}
                  onDoubleClick={() => onPlay(index)}
                  sx={{ "&.Mui-selected": { bgcolor: "rgba(38,231,223,.11)" } }}
                >
                  <TableCell width={42} sx={{ border: 0, color: "text.secondary" }}>
                    {active ? <VolumeUpIcon fontSize="small" /> : index + 1}
                  </TableCell>
                  <TableCell sx={{ border: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar
                        variant="rounded"
                        src={
                          item.media.album?._id
                            ? apiAssetUrl(`/album/${item.media.album._id}/cover`)
                            : undefined
                        }
                        sx={{ width: 48, height: 48 }}
                      >
                        {item.mediaType === "video" && <OndemandVideoIcon />}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography noWrap fontWeight={700}>
                          {item.media.title}
                        </Typography>
                        <Typography noWrap color="text.secondary" fontSize={14}>
                          {item.media.artist.join(", ")} ·{" "}
                          {item.mediaType === "video" ? "Video" : "Audio"}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ border: 0, color: "text.secondary" }}>
                    {formatDuration(item.media.duration)}
                  </TableCell>
                  <TableCell align="right" width={52} sx={{ border: 0 }}>
                    <IconButton
                      aria-label={`${item.media.title} actions`}
                      onClick={(event) =>
                        setMenu({ anchor: event.currentTarget, itemId: item._id })
                      }
                    >
                      <MoreHorizIcon />
                    </IconButton>
                  </TableCell>
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
