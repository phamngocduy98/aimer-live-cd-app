import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import DeleteIcon from "@mui/icons-material/Delete";
import SubtitlesIcon from "@mui/icons-material/Subtitles";
import TranslateIcon from "@mui/icons-material/Translate";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
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
import axios from "axios";
import React from "react";
import {
  generateRomaji,
  importExternalLyrics,
  previewSrt,
  searchExternalLyrics,
  translateLyrics
} from "@features/lyrics/api/lyrics";
import { useLyrics, useLyricsProviders, useSaveLyricsRows } from "@features/lyrics/hooks/useLyrics";
import type {
  LyricCue,
  LyricLanguage,
  LyricMediaType,
  LyricProvenance,
  LyricsCandidate,
  LyricsRow,
  TranslationProvider
} from "@features/lyrics";

interface LyricsMedia {
  _id: string;
  title: string;
  artist?: string[];
  duration?: number;
  album?: { title?: string };
}

const columns: { key: LyricLanguage; label: string }[] = [
  { key: "ja", label: "Japanese" },
  { key: "romaji", label: "Romaji" },
  { key: "en", label: "English" },
  { key: "vi", label: "Vietnamese" }
];

export function SynchronizedLyricsDialog({
  media,
  mediaType,
  open,
  onClose
}: {
  media: LyricsMedia | null;
  mediaType: LyricMediaType;
  open: boolean;
  onClose: () => void;
}) {
  const lyrics = useLyrics(mediaType, media?._id, open);
  const providers = useLyricsProviders();
  const save = useSaveLyricsRows();
  const [rows, setRows] = React.useState<LyricsRow[]>([]);
  const [provenance, setProvenance] = React.useState<
    Partial<Record<LyricLanguage, LyricProvenance>>
  >({});
  const [dirty, setDirty] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [srtOpen, setSrtOpen] = React.useState(false);
  const [lrclibOpen, setLrclibOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const hydratedMediaRef = React.useRef("");

  const provider = (providers.data?.translation?.[0] ?? "mymemory") as TranslationProvider;

  const srtMutation = useMutation({
    mutationFn: async (file: File) => {
      const japanese = await previewSrt(file);
      const romaji = await generateRomaji(japanese);
      return rowsFromCues(japanese, romaji);
    },
    onSuccess: (nextRows) => {
      replaceImportedRows(nextRows, {
        ja: { source: "manual-srt" },
        romaji: { source: "kuroshiro" }
      });
      setSrtOpen(false);
      setNotice(`Loaded ${nextRows.length} Japanese rows and generated Romaji.`);
    },
    onError: (value) => setError(errorMessage(value))
  });

  const importMutation = useMutation({
    mutationFn: (candidate: LyricsCandidate) =>
      importExternalLyrics(mediaType, media!._id, candidate.id, media?.duration),
    onSuccess: (result) => {
      replaceImportedRows(result.rows, result.provenance);
      setLrclibOpen(false);
      setNotice(`Loaded ${result.rows.length} LRCLIB rows and generated Romaji.`);
    },
    onError: (value) => setError(errorMessage(value))
  });

  const romanizeMutation = useMutation({
    mutationFn: () => generateRomaji(cuesFromRows(rows)),
    onSuccess: (cues) => {
      replaceColumn("romaji", cues, { source: "kuroshiro" });
      setNotice("Romaji generated.");
    },
    onError: (value) => setError(errorMessage(value))
  });

  const translateMutation = useMutation({
    mutationFn: (target: "en" | "vi") => translateLyrics(cuesFromRows(rows), target, provider),
    onSuccess: (result, target) => {
      replaceColumn(target, result.cues, { source: result.source });
      setNotice(`${target === "en" ? "English" : "Vietnamese"} generated.`);
    },
    onError: (value) => setError(errorMessage(value))
  });

  React.useEffect(() => {
    if (!open || !media || lyrics.isLoading) return;
    const key = `${mediaType}:${media._id}`;
    if (hydratedMediaRef.current === key) return;
    hydratedMediaRef.current = key;
    setRows(cloneRows(lyrics.data?.rows ?? []));
    setProvenance({ ...(lyrics.data?.provenance ?? {}) });
    setDirty(false);
    setError("");
    setNotice("");
  }, [lyrics.data, lyrics.isLoading, media, mediaType, open]);

  React.useEffect(() => {
    if (!open) hydratedMediaRef.current = "";
  }, [open]);

  if (!media) return null;

  const busy =
    lyrics.isLoading ||
    save.isPending ||
    srtMutation.isPending ||
    importMutation.isPending ||
    romanizeMutation.isPending ||
    translateMutation.isPending;

  function replaceImportedRows(
    nextRows: LyricsRow[],
    nextProvenance: Partial<Record<LyricLanguage, LyricProvenance>>
  ): void {
    setRows(cloneRows(nextRows));
    setProvenance(nextProvenance);
    setDirty(true);
    setError("");
  }

  function replaceColumn(
    language: "romaji" | "en" | "vi",
    cues: LyricCue[],
    nextProvenance: LyricProvenance
  ): void {
    setRows((current) =>
      current.map((row, index) => ({
        ...row,
        [language]: cues[index]?.text || undefined
      }))
    );
    setProvenance((current) => ({ ...current, [language]: nextProvenance }));
    setDirty(true);
    setError("");
  }

  function editRow(index: number, patch: Partial<LyricsRow>): void {
    setRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row))
    );
    for (const column of columns) {
      if (column.key in patch) {
        setProvenance((current) => ({
          ...current,
          [column.key]: { source: "manual" }
        }));
      }
    }
    setDirty(true);
    setError("");
  }

  function performSave(): void {
    save.mutate(
      { mediaType, mediaId: media!._id, rows, provenance },
      {
        onSuccess: (saved) => {
          setRows(cloneRows(saved.rows));
          setProvenance({ ...(saved.provenance ?? {}) });
          setDirty(false);
          setConfirmOpen(false);
          setNotice("Synchronized lyrics saved.");
        },
        onError: (value) => setError(errorMessage(value))
      }
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={busy ? undefined : onClose}
        maxWidth="xl"
        fullWidth
        aria-labelledby="synchronized-lyrics-title"
      >
        <DialogTitle id="synchronized-lyrics-title">Synchronized Lyrics: {media.title}</DialogTitle>
        {busy && <LinearProgress />}
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {notice && <Alert severity="success">{notice}</Alert>}
          <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
            <Button
              variant="outlined"
              startIcon={<SubtitlesIcon />}
              disabled={busy}
              onClick={() => {
                setError("");
                setSrtOpen(true);
              }}
            >
              Import SRT
            </Button>
            <Button
              variant="outlined"
              startIcon={<CloudDownloadIcon />}
              disabled={busy}
              onClick={() => {
                setError("");
                setLrclibOpen(true);
              }}
            >
              Import LRCLIB
            </Button>
            <Button
              variant="outlined"
              startIcon={<AutoFixHighIcon />}
              disabled={rows.length === 0 || busy}
              onClick={() => romanizeMutation.mutate()}
            >
              Generate Romaji
            </Button>
            <Button
              variant="outlined"
              startIcon={<TranslateIcon />}
              disabled={rows.length === 0 || busy}
              onClick={() => translateMutation.mutate("en")}
            >
              Generate English
            </Button>
            <Button
              variant="outlined"
              startIcon={<TranslateIcon />}
              disabled={rows.length === 0 || busy}
              onClick={() => translateMutation.mutate("vi")}
            >
              Generate Vietnamese
            </Button>
          </Stack>

          <TableContainer sx={{ maxHeight: "60vh", border: 1, borderColor: "divider" }}>
            <Table size="small" stickyHeader aria-label="Synchronized lyrics table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 115 }}>Start ms</TableCell>
                  <TableCell sx={{ width: 115 }}>End ms</TableCell>
                  {columns.map((column) => (
                    <TableCell key={column.key} sx={{ minWidth: 220 }}>
                      {column.label}
                    </TableCell>
                  ))}
                  <TableCell sx={{ width: 52 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={`${row.startMs}-${row.endMs}-${index}`}>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={row.startMs}
                        inputProps={{ "aria-label": `Row ${index + 1} start` }}
                        onChange={(event) =>
                          editRow(index, { startMs: Number(event.target.value) })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={row.endMs}
                        inputProps={{ "aria-label": `Row ${index + 1} end` }}
                        onChange={(event) => editRow(index, { endMs: Number(event.target.value) })}
                      />
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        <TextField
                          size="small"
                          fullWidth
                          multiline
                          required={column.key === "ja"}
                          value={row[column.key] ?? ""}
                          inputProps={{
                            "aria-label": `Row ${index + 1} ${column.label}`
                          }}
                          onChange={(event) =>
                            editRow(index, {
                              [column.key]: event.target.value
                            } as Partial<LyricsRow>)
                          }
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button
                        aria-label={`Delete lyric row ${index + 1}`}
                        color="error"
                        onClick={() => {
                          setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
                          setDirty(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography color="text.secondary">
                        Import Japanese SRT or LRCLIB lyrics to begin.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={busy}>
            Close
          </Button>
          <Button
            variant="contained"
            disabled={!dirty || rows.length === 0 || busy}
            onClick={() => (lyrics.data ? setConfirmOpen(true) : performSave())}
          >
            Save lyrics
          </Button>
        </DialogActions>
      </Dialog>

      <SrtImportDialog
        open={srtOpen}
        busy={srtMutation.isPending}
        error={error}
        onClose={() => setSrtOpen(false)}
        onImport={(file) => {
          setError("");
          srtMutation.mutate(file);
        }}
      />
      <LrclibImportDialog
        open={lrclibOpen}
        media={media}
        mediaType={mediaType}
        busy={importMutation.isPending}
        importError={error}
        onClose={() => setLrclibOpen(false)}
        onImport={(candidate) => importMutation.mutate(candidate)}
      />

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Replace existing lyrics?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Saving will replace all synchronized lyric rows for this media item.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={performSave}>
            Replace and save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function SrtImportDialog({
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

function LrclibImportDialog({
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

function rowsFromCues(japanese: LyricCue[], romaji: LyricCue[]): LyricsRow[] {
  return japanese.map((cue, index) => ({
    startMs: cue.startMs,
    endMs: cue.endMs,
    ja: cue.text,
    ...(romaji[index]?.text ? { romaji: romaji[index].text } : {})
  }));
}

function cuesFromRows(rows: LyricsRow[]): LyricCue[] {
  return rows.map((row) => ({ startMs: row.startMs, endMs: row.endMs, text: row.ja }));
}

function cloneRows(rows: LyricsRow[]): LyricsRow[] {
  return rows.map((row) => ({ ...row }));
}

function errorMessage(value: unknown): string {
  if (axios.isAxiosError(value)) {
    const data = value.response?.data as { message?: string } | string | undefined;
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
  }
  return value instanceof Error ? value.message : String(value);
}
