import React from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import {
  generateRomaji,
  importExternalLyrics,
  previewSrt,
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
import { lyricColumns } from "../utils/lyricsColumns";
import { cloneRows, cuesFromRows, errorMessage, rowsFromCues } from "../utils/lyricsRows";
import { LyricsTable, LyricsToolbar, ReplaceLyricsDialog } from "./LyricsEditor";
import { LrclibImportDialog, SrtImportDialog, type LyricsMedia } from "./LyricsImportDialogs";

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
    for (const column of lyricColumns) {
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
          <LyricsToolbar
            busy={busy}
            hasRows={rows.length > 0}
            onImportSrt={() => {
              setError("");
              setSrtOpen(true);
            }}
            onImportLrclib={() => {
              setError("");
              setLrclibOpen(true);
            }}
            onGenerateRomaji={() => romanizeMutation.mutate()}
            onGenerateEnglish={() => translateMutation.mutate("en")}
            onGenerateVietnamese={() => translateMutation.mutate("vi")}
          />
          <LyricsTable
            rows={rows}
            onEdit={editRow}
            onDelete={(index) => {
              setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
              setDirty(true);
            }}
          />
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
      <ReplaceLyricsDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={performSave}
      />
    </>
  );
}
