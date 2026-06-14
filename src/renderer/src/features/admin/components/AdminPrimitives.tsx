import React from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import AlbumIcon from "@mui/icons-material/Album";
import DeleteIcon from "@mui/icons-material/Delete";
import DnsIcon from "@mui/icons-material/Dns";
import EditIcon from "@mui/icons-material/Edit";
import GroupsIcon from "@mui/icons-material/Groups";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import LyricsIcon from "@mui/icons-material/Lyrics";
import MovieIcon from "@mui/icons-material/Movie";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import type { AdminTab } from "../types";

interface Column<T> {
  key: string;
  label: string;
  width?: number | string;
  render: (row: T) => React.ReactNode;
}

const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: "uploads", label: "Uploads", icon: <UploadFileIcon /> },
  { id: "songs", label: "Songs", icon: <LibraryMusicIcon /> },
  { id: "videos", label: "Videos", icon: <MovieIcon /> },
  { id: "albums", label: "Albums", icon: <AlbumIcon /> },
  { id: "artists", label: "Artists", icon: <GroupsIcon /> },
  { id: "hosts", label: "Hosting Provider", icon: <DnsIcon /> }
];

export function AdminTable<T extends { _id?: string; id?: string }>({
  ariaLabel,
  rows,
  columns,
  loading
}: {
  ariaLabel: string;
  rows: T[];
  columns: Column<T>[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 280 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <TableContainer sx={{ height: "100%", overflow: "auto" }}>
      <Table stickyHeader size="small" aria-label={ariaLabel}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                width={column.width}
                sx={{ bgcolor: "#111", color: "#aaa", borderColor: "rgba(255,255,255,.08)" }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row._id ?? row.id}
              hover
              sx={{
                "& td": { borderColor: "rgba(255,255,255,.06)" },
                "&:hover": { bgcolor: "rgba(255,255,255,.05)" }
              }}
            >
              {columns.map((column) => (
                <TableCell key={column.key} sx={{ color: "#ddd" }}>
                  {column.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function AdminNavigation({
  value,
  onChange
}: {
  value: AdminTab;
  onChange: (tab: AdminTab) => void;
}) {
  return (
    <Box
      component="nav"
      aria-label="Admin sections"
      sx={{
        width: 230,
        flexShrink: 0,
        bgcolor: "#050505",
        borderRight: "1px solid rgba(255,255,255,.08)",
        p: 1.25
      }}
    >
      <Stack spacing={0.75}>
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            startIcon={tab.icon}
            onClick={() => onChange(tab.id)}
            aria-current={value === tab.id ? "page" : undefined}
            sx={{
              justifyContent: "flex-start",
              color: value === tab.id ? "#fff" : "#a7a7a7",
              bgcolor: value === tab.id ? "rgba(255,255,255,.11)" : "transparent",
              borderRadius: 1,
              minHeight: 42,
              px: 1.4,
              textTransform: "none",
              "&:hover": { bgcolor: "rgba(255,255,255,.09)" }
            }}
          >
            {tab.label}
          </Button>
        ))}
      </Stack>
    </Box>
  );
}

export function AdminActions({
  onEdit,
  onLyrics,
  onDelete
}: {
  onEdit?: () => void;
  onLyrics?: () => void;
  onDelete?: () => void;
}) {
  return (
    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
      {onEdit && (
        <IconButton size="small" aria-label="Edit" onClick={onEdit}>
          <EditIcon fontSize="small" />
        </IconButton>
      )}
      {onLyrics && (
        <IconButton size="small" aria-label="Lyrics" onClick={onLyrics}>
          <LyricsIcon fontSize="small" />
        </IconButton>
      )}
      {onDelete && (
        <IconButton size="small" aria-label="Delete" onClick={onDelete}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
    </Stack>
  );
}

export function ConfirmDialog({
  title,
  message,
  open,
  pending,
  onClose,
  onConfirm
}: {
  title: string;
  message: string;
  open: boolean;
  pending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" onClick={onConfirm} disabled={pending}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
