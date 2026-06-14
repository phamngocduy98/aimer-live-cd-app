import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import DeleteIcon from "@mui/icons-material/Delete";
import SubtitlesIcon from "@mui/icons-material/Subtitles";
import TranslateIcon from "@mui/icons-material/Translate";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import type { LyricsRow } from "@features/lyrics";
import { lyricColumns } from "../utils/lyricsColumns";

export function LyricsToolbar({
  busy,
  hasRows,
  onImportSrt,
  onImportLrclib,
  onGenerateRomaji,
  onGenerateEnglish,
  onGenerateVietnamese
}: {
  busy: boolean;
  hasRows: boolean;
  onImportSrt: () => void;
  onImportLrclib: () => void;
  onGenerateRomaji: () => void;
  onGenerateEnglish: () => void;
  onGenerateVietnamese: () => void;
}) {
  return (
    <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
      <Button
        variant="outlined"
        startIcon={<SubtitlesIcon />}
        disabled={busy}
        onClick={onImportSrt}
      >
        Import SRT
      </Button>
      <Button
        variant="outlined"
        startIcon={<CloudDownloadIcon />}
        disabled={busy}
        onClick={onImportLrclib}
      >
        Import LRCLIB
      </Button>
      <Button
        variant="outlined"
        startIcon={<AutoFixHighIcon />}
        disabled={!hasRows || busy}
        onClick={onGenerateRomaji}
      >
        Generate Romaji
      </Button>
      <Button
        variant="outlined"
        startIcon={<TranslateIcon />}
        disabled={!hasRows || busy}
        onClick={onGenerateEnglish}
      >
        Generate English
      </Button>
      <Button
        variant="outlined"
        startIcon={<TranslateIcon />}
        disabled={!hasRows || busy}
        onClick={onGenerateVietnamese}
      >
        Generate Vietnamese
      </Button>
    </Stack>
  );
}

export function LyricsTable({
  rows,
  onEdit,
  onDelete
}: {
  rows: LyricsRow[];
  onEdit: (index: number, patch: Partial<LyricsRow>) => void;
  onDelete: (index: number) => void;
}) {
  return (
    <TableContainer sx={{ maxHeight: "60vh", border: 1, borderColor: "divider" }}>
      <Table size="small" stickyHeader aria-label="Synchronized lyrics table">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 115 }}>Start ms</TableCell>
            <TableCell sx={{ width: 115 }}>End ms</TableCell>
            {lyricColumns.map((column) => (
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
                  onChange={(event) => onEdit(index, { startMs: Number(event.target.value) })}
                />
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  type="number"
                  value={row.endMs}
                  inputProps={{ "aria-label": `Row ${index + 1} end` }}
                  onChange={(event) => onEdit(index, { endMs: Number(event.target.value) })}
                />
              </TableCell>
              {lyricColumns.map((column) => (
                <TableCell key={column.key}>
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    required={column.key === "ja"}
                    value={row[column.key] ?? ""}
                    inputProps={{ "aria-label": `Row ${index + 1} ${column.label}` }}
                    onChange={(event) =>
                      onEdit(index, {
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
                  onClick={() => onDelete(index)}
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
  );
}

export function ReplaceLyricsDialog({
  open,
  onClose,
  onConfirm
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Replace existing lyrics?</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">
          Saving will replace all synchronized lyric rows for this media item.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="warning" onClick={onConfirm}>
          Replace and save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
