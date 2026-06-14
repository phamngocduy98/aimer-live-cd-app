import React from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { searchExternalLyrics } from "@features/lyrics/api/lyrics";
import type { LyricMediaType, LyricsCandidate } from "@features/lyrics";
import { errorMessage } from "../utils/lyricsRows";

export interface LyricsMedia {
  _id: string;
  title: string;
  artist?: string[];
  duration?: number;
  album?: { title?: string };
}

export function SrtImportDialog({
  open,
  busy,
  error,
  onClose,
  onImport
}: {
  open: boolean;
  busy: boolean;
  error: string;
  onClose: () => void;
  onImport: (file: File) => void;
}) {
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Import Japanese SRT</DialogTitle>
      {busy && <LinearProgress />}
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          The SRT text is treated as Japanese. Existing rows will be replaced and Romaji generated.
        </Typography>
        <Button component="label" variant="contained" disabled={busy} fullWidth>
          Choose Japanese SRT
          <input
            hidden
            type="file"
            accept=".srt,application/x-subrip,text/plain"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.currentTarget.value = "";
            }}
          />
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function LrclibImportDialog({
  open,
  media,
  mediaType,
  busy,
  importError,
  onClose,
  onImport
}: {
  open: boolean;
  media: LyricsMedia;
  mediaType: LyricMediaType;
  busy: boolean;
  importError: string;
  onClose: () => void;
  onImport: (candidate: LyricsCandidate) => void;
}) {
  const [query, setQuery] = React.useState({
    trackName: media.title,
    artistName: media.artist?.[0] ?? "",
    albumName: media.album?.title ?? "",
    duration: media.duration?.toString() ?? ""
  });
  const [candidates, setCandidates] = React.useState<LyricsCandidate[]>([]);
  const [error, setError] = React.useState("");
  const search = useMutation({
    mutationFn: () =>
      searchExternalLyrics(mediaType, media._id, {
        trackName: query.trackName,
        artistName: query.artistName,
        albumName: query.albumName,
        duration: Number(query.duration) || undefined
      }),
    onSuccess: (result) => {
      setCandidates(result);
      setError("");
    },
    onError: (value) => setError(errorMessage(value))
  });

  React.useEffect(() => {
    if (!open) return;
    setQuery({
      trackName: media.title,
      artistName: media.artist?.[0] ?? "",
      albumName: media.album?.title ?? "",
      duration: media.duration?.toString() ?? ""
    });
    setCandidates([]);
    setError("");
  }, [media, open]);

  const pending = busy || search.isPending;
  return (
    <Dialog open={open} onClose={pending ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>Import Japanese lyrics from LRCLIB</DialogTitle>
      {pending && <LinearProgress />}
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {(error || importError) && <Alert severity="error">{error || importError}</Alert>}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
            gap: 1
          }}
        >
          <TextField
            label="Track"
            value={query.trackName}
            onChange={(event) => setQuery({ ...query, trackName: event.target.value })}
          />
          <TextField
            label="Artist"
            value={query.artistName}
            onChange={(event) => setQuery({ ...query, artistName: event.target.value })}
          />
          <TextField
            label="Album"
            value={query.albumName}
            onChange={(event) => setQuery({ ...query, albumName: event.target.value })}
          />
          <TextField
            label="Duration (seconds)"
            type="number"
            value={query.duration}
            onChange={(event) => setQuery({ ...query, duration: event.target.value })}
          />
        </Box>
        <Button
          variant="contained"
          disabled={!query.trackName.trim() || !query.artistName.trim() || pending}
          onClick={() => search.mutate()}
        >
          Search LRCLIB
        </Button>
        {candidates.length > 0 && (
          <TableContainer sx={{ maxHeight: 300, border: 1, borderColor: "divider" }}>
            <Table size="small" stickyHeader aria-label="LRCLIB results">
              <TableHead>
                <TableRow>
                  <TableCell>Track</TableCell>
                  <TableCell>Artist</TableCell>
                  <TableCell>Album</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {candidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>{candidate.trackName}</TableCell>
                    <TableCell>{candidate.artistName}</TableCell>
                    <TableCell>{candidate.albumName}</TableCell>
                    <TableCell>{Math.round(candidate.duration)}s</TableCell>
                    <TableCell>
                      {candidate.instrumental
                        ? "Instrumental"
                        : candidate.synchronized
                          ? "Synchronized"
                          : "Plain lyrics only"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        disabled={candidate.instrumental || !candidate.synchronized || pending}
                        onClick={() => onImport(candidate)}
                      >
                        Import
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
