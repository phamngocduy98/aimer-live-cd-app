import React from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
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
import type { SelectChangeEvent } from "@mui/material/Select";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/Image";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { apiAssetUrl } from "@lib/axios";
import { artistImageUrl } from "@utils/artist";
import { MediaCard } from "@components/media/MediaCard";
import type { LyricsRow } from "@features/lyrics";
import {
  useCreateYoutubeVideo,
  useLoadYoutubeVideoMetadata,
  usePreviewYoutubeLyrics,
  useRenameAdminArtist,
  useSaveAdminHost,
  useUpdateAdminAlbum,
  useUpdateAdminAlbumCover,
  useUpdateAdminArtistImage,
  useUpdateAdminSong,
  useUpdateAdminVideo,
  useUpdateAdminVideoCover,
  useUploadAdminMedia
} from "../hooks/useAdmin";
import { listAdminSongs, listAdminVideos, uploadProgressUrl } from "../api/admin";
import type {
  AdminAlbum,
  AdminArtist,
  AdminHost,
  AdminSong,
  AdminVideo,
  YoutubeVideoMetadataPreview,
  YoutubeVideoSubtitle
} from "../types";
import {
  joinArtists,
  parseChapterCsv,
  parseChapterTime,
  splitList
} from "../utils/adminFormatting";
import { AdminTable } from "./AdminPrimitives";

function errorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : fallback;
}

function base64ToFile(base64: string, mimeType: string, fileName: string): File {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return new File([bytes], fileName, { type: mimeType });
}

function coverFileFromPreview(preview: YoutubeVideoMetadataPreview): File | null {
  if (!preview.cover) return null;
  const extension = preview.cover.mimeType.split("/")[1] || "jpg";
  return base64ToFile(preview.cover.base64, preview.cover.mimeType, `youtube-cover.${extension}`);
}

function YoutubeLyricsPreviewPanel({
  rows,
  loading,
  error,
  subtitleCount
}: {
  rows: LyricsRow[];
  loading: boolean;
  error: string;
  subtitleCount: number;
}) {
  return (
    <Box
      sx={(theme) => ({
        p: 2,
        borderRadius: `${theme.design.radius.card}px`,
        bgcolor: "rgba(255,255,255,.035)",
        border: `1px solid ${theme.design.color.border}`
      })}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Lyrics preview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading
              ? "Loading YouTube captions..."
              : rows.length
                ? `${rows.length} synchronized rows from YouTube captions`
                : subtitleCount
                  ? "Japanese captions are required to build lyric rows."
                  : "No YouTube captions found."}
          </Typography>
        </Box>
        {rows.length > 0 && <Chip size="small" color="success" label="Will save as lyrics" />}
      </Stack>
      {error && (
        <Alert severity="warning" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      )}
      {rows.length > 0 && (
        <TableContainer sx={{ mt: 1.5, maxHeight: 220, border: 1, borderColor: "divider" }}>
          <Table size="small" stickyHeader aria-label="YouTube lyrics preview table">
            <TableHead>
              <TableRow>
                <TableCell width={90}>Start</TableCell>
                <TableCell>Japanese</TableCell>
                <TableCell>Romaji</TableCell>
                <TableCell>English</TableCell>
                <TableCell>Vietnamese</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.slice(0, 8).map((row, index) => (
                <TableRow key={`${row.startMs}-${index}`}>
                  <TableCell>{Math.round(row.startMs / 1000)}s</TableCell>
                  <TableCell>{row.ja}</TableCell>
                  <TableCell>{row.romaji ?? ""}</TableCell>
                  <TableCell>{row.en ?? ""}</TableCell>
                  <TableCell>{row.vi ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export function SongEditDialog({
  song,
  albums,
  open,
  onClose
}: {
  song: AdminSong | null;
  albums: AdminAlbum[];
  open: boolean;
  onClose: () => void;
}) {
  const update = useUpdateAdminSong();
  const [draft, setDraft] = React.useState({ title: "", artist: "", trackNo: "", album: "" });

  React.useEffect(() => {
    setDraft({
      title: song?.title ?? "",
      artist: joinArtists(song?.artist),
      trackNo: song?.trackNo?.toString() ?? "",
      album: song?.album?._id ?? ""
    });
  }, [song]);

  if (!song) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit song metadata</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Title"
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
          <TextField
            label="Artists"
            value={draft.artist}
            helperText="Comma separated"
            onChange={(event) => setDraft({ ...draft, artist: event.target.value })}
          />
          <TextField
            label="Track number"
            type="number"
            value={draft.trackNo}
            onChange={(event) => setDraft({ ...draft, trackNo: event.target.value })}
          />
          <InputLabel id="song-album-label">Album</InputLabel>
          <Select
            labelId="song-album-label"
            value={draft.album}
            onChange={(event) => setDraft({ ...draft, album: event.target.value })}
          >
            <MenuItem value="">None</MenuItem>
            {albums.map((album) => (
              <MenuItem key={album._id} value={album._id}>
                {album.title}
              </MenuItem>
            ))}
          </Select>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={() =>
            update.mutate(
              {
                id: song._id,
                data: {
                  title: draft.title,
                  artist: splitList(draft.artist),
                  trackNo: draft.trackNo ? Number(draft.trackNo) : undefined,
                  album: draft.album as unknown as AdminAlbum
                }
              },
              { onSuccess: onClose }
            )
          }
          disabled={update.isPending}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function VideoEditDialog({
  video,
  open,
  onClose
}: {
  video: AdminVideo | null;
  open: boolean;
  onClose: () => void;
}) {
  const update = useUpdateAdminVideo();
  const updateCover = useUpdateAdminVideoCover();
  const [draft, setDraft] = React.useState({
    title: "",
    artist: "",
    genre: "",
    year: "",
    chapters: [] as NonNullable<AdminVideo["chapters"]>
  });
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = React.useState<string>();
  const [saveError, setSaveError] = React.useState("");

  React.useEffect(() => {
    setDraft({
      title: video?.title ?? "",
      artist: joinArtists(video?.artist),
      genre: video?.genre?.join(", ") ?? "",
      year: video?.year?.toString() ?? "",
      chapters: video?.chapters ?? []
    });
    setCoverFile(null);
    setSaveError("");
  }, [video]);

  React.useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl(undefined);
      return;
    }
    const previewUrl = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [coverFile]);

  if (!video) return null;
  const saving = update.isPending || updateCover.isPending;
  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: (theme) => ({
          backgroundImage: "none",
          border: `1px solid ${theme.design.color.border}`,
          maxHeight: "calc(100% - 32px)"
        })
      }}
    >
      <DialogTitle component="div" sx={{ pb: 1 }}>
        <Typography variant="overline" color="primary.main">
          Video library
        </Typography>
        <Typography component="h2" variant="h5" fontWeight={850}>
          Edit video metadata
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {saveError && <Alert severity="error">{saveError}</Alert>}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "minmax(260px, 0.8fr) minmax(0, 1.8fr)" },
              gap: 3
            }}
          >
            <Stack spacing={1.5}>
              <Box
                sx={(theme) => ({
                  position: "relative",
                  overflow: "hidden",
                  aspectRatio: "16 / 9",
                  borderRadius: `${theme.design.radius.artwork}px`,
                  border: `1px solid ${theme.design.color.borderStrong}`,
                  bgcolor: theme.design.color.surfaceRaised,
                  boxShadow: theme.design.shadow.card
                })}
              >
                <Box
                  component="img"
                  src={
                    coverPreviewUrl ??
                    (video.hasCover ? apiAssetUrl(`/video/${video._id}/cover`) : undefined)
                  }
                  alt={`${draft.title || video.title} cover`}
                  sx={{ width: 1, height: 1, display: "block", objectFit: "cover" }}
                />
                {!coverPreviewUrl && !video.hasCover && (
                  <Stack
                    alignItems="center"
                    justifyContent="center"
                    spacing={1}
                    sx={{ position: "absolute", inset: 0, color: "text.secondary" }}
                  >
                    <ImageIcon fontSize="large" />
                    <Typography variant="body2">No cover artwork</Typography>
                  </Stack>
                )}
              </Box>
              <Button
                component="label"
                variant={coverFile ? "contained" : "outlined"}
                startIcon={<PhotoCameraIcon />}
                sx={{ minHeight: 44 }}
              >
                {coverFile ? "Choose a different cover" : "Change cover"}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
                />
              </Button>
              <Box
                sx={(theme) => ({
                  minHeight: 58,
                  px: 1.5,
                  py: 1.25,
                  borderRadius: `${theme.design.radius.row}px`,
                  bgcolor: theme.design.color.surfaceHover
                })}
              >
                <Typography variant="caption" color="text.secondary">
                  {coverFile ? "Ready to upload" : "Artwork"}
                </Typography>
                <Typography variant="body2" noWrap title={coverFile?.name}>
                  {coverFile?.name ?? "Landscape images work best (16:9)"}
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 180px" },
                gap: 2,
                alignContent: "start"
              }}
            >
              <TextField
                label="Title"
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                sx={{ gridColumn: { sm: "1 / -1" } }}
              />
              <TextField
                label="Artists"
                value={draft.artist}
                helperText="Separate multiple artists with commas"
                onChange={(event) => setDraft({ ...draft, artist: event.target.value })}
                sx={{ gridColumn: { sm: "1 / -1" } }}
              />
              <TextField
                label="Genres"
                value={draft.genre}
                helperText="Comma separated"
                onChange={(event) => setDraft({ ...draft, genre: event.target.value })}
              />
              <TextField
                label="Release year"
                type="number"
                value={draft.year}
                onChange={(event) => setDraft({ ...draft, year: event.target.value })}
              />
            </Box>
          </Box>

          <Divider />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={1.5}
          >
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Chapters
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {draft.chapters.length} {draft.chapters.length === 1 ? "marker" : "markers"} in this
                video
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button component="label" size="small" variant="outlined">
                Import CSV
                <input
                  hidden
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setDraft({ ...draft, chapters: parseChapterCsv(await file.text()) ?? [] });
                  }}
                />
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={() =>
                  setDraft({
                    ...draft,
                    chapters: [...draft.chapters, { time: 0, title: "", subTitle: "" }]
                  })
                }
              >
                Add chapter
              </Button>
            </Stack>
          </Stack>
          <TableContainer
            sx={(theme) => ({
              maxHeight: 320,
              border: `1px solid ${theme.design.color.border}`,
              borderRadius: `${theme.design.radius.card}px`
            })}
          >
            <Table
              size="small"
              aria-label="Video chapters table"
              stickyHeader
              sx={{ minWidth: 720 }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Subtitle</TableCell>
                  <TableCell width={52}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {draft.chapters.map((chapter, index) => (
                  <TableRow key={`${chapter.time}-${index}`}>
                    <TableCell>
                      <TextField
                        size="small"
                        value={chapter.time}
                        onChange={(event) => {
                          const chapters = [...draft.chapters];
                          chapters[index] = {
                            ...chapter,
                            time: parseChapterTime(event.target.value)
                          };
                          setDraft({ ...draft, chapters });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={chapter.title}
                        onChange={(event) => {
                          const chapters = [...draft.chapters];
                          chapters[index] = { ...chapter, title: event.target.value };
                          setDraft({ ...draft, chapters });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={chapter.subTitle ?? ""}
                        onChange={(event) => {
                          const chapters = [...draft.chapters];
                          chapters[index] = { ...chapter, subTitle: event.target.value };
                          setDraft({ ...draft, chapters });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        aria-label="Delete chapter"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            chapters: draft.chapters.filter(
                              (_item, itemIndex) => itemIndex !== index
                            )
                          })
                        }
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={async () => {
            setSaveError("");
            try {
              await update.mutateAsync({
                id: video._id,
                data: {
                  title: draft.title,
                  artist: splitList(draft.artist),
                  genre: splitList(draft.genre),
                  year: draft.year ? Number(draft.year) : undefined,
                  chapters: draft.chapters
                }
              });
              if (coverFile) {
                await updateCover.mutateAsync({ id: video._id, file: coverFile });
              }
              onClose();
            } catch (error) {
              setSaveError(
                error instanceof Error ? error.message : "Could not save video metadata"
              );
            }
          }}
          disabled={saving || !draft.title.trim()}
        >
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function YoutubeVideoCreateDialog({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const loadMetadata = useLoadYoutubeVideoMetadata();
  const previewLyrics = usePreviewYoutubeLyrics();
  const createVideo = useCreateYoutubeVideo();
  const [loaded, setLoaded] = React.useState(false);
  const [draft, setDraft] = React.useState({
    youtubeUrl: "",
    title: "",
    artist: "",
    genre: "",
    year: "",
    duration: "",
    videoCodecRaw: "",
    audioCodecRaw: "",
    audioSampleRate: "",
    bitrate: "",
    fileExtension: "",
    chapters: [] as NonNullable<AdminVideo["chapters"]>
  });
  const [subtitles, setSubtitles] = React.useState<YoutubeVideoSubtitle[]>([]);
  const [lyricsPreviewRows, setLyricsPreviewRows] = React.useState<LyricsRow[]>([]);
  const [lyricsPreviewError, setLyricsPreviewError] = React.useState("");
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = React.useState<string>();
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setLoaded(false);
    setDraft({
      youtubeUrl: "",
      title: "",
      artist: "",
      genre: "",
      year: "",
      duration: "",
      videoCodecRaw: "",
      audioCodecRaw: "",
      audioSampleRate: "",
      bitrate: "",
      fileExtension: "",
      chapters: []
    });
    setSubtitles([]);
    setLyricsPreviewRows([]);
    setLyricsPreviewError("");
    setCoverFile(null);
    setError("");
  }, [open]);

  React.useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl(undefined);
      return;
    }
    const previewUrl = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [coverFile]);

  const busy = loadMetadata.isPending || previewLyrics.isPending || createVideo.isPending;
  const duration = Number(draft.duration);
  const canSave =
    loaded &&
    draft.youtubeUrl.trim() &&
    draft.title.trim() &&
    splitList(draft.artist).length > 0 &&
    Number.isFinite(duration) &&
    duration >= 0;

  const loadFromYoutube = async () => {
    setError("");
    try {
      const preview = await loadMetadata.mutateAsync({ youtubeUrl: draft.youtubeUrl });
      setLoaded(true);
      setDraft({
        youtubeUrl: preview.youtubeUrl,
        title: preview.title,
        artist: joinArtists(preview.artists),
        genre: "",
        year: "",
        duration: Math.round(preview.duration).toString(),
        videoCodecRaw: preview.videoCodecRaw ?? "",
        audioCodecRaw: preview.audioCodecRaw ?? "",
        audioSampleRate: preview.audioSampleRate?.toString() ?? "",
        bitrate: preview.bitrate?.toString() ?? "",
        fileExtension: preview.fileExtension ?? "",
        chapters: preview.chapters
      });
      setSubtitles(preview.subtitles ?? []);
      setLyricsPreviewRows([]);
      setLyricsPreviewError("");
      if (preview.subtitles?.length) {
        try {
          const lyrics = await previewLyrics.mutateAsync({ subtitles: preview.subtitles });
          setLyricsPreviewRows(lyrics.rows);
        } catch (previewError) {
          setLyricsPreviewError(errorMessage(previewError, "Could not preview YouTube lyrics"));
        }
      }
      setCoverFile(coverFileFromPreview(preview));
    } catch (loadError) {
      setLoaded(false);
      setError(errorMessage(loadError, "Could not load YouTube metadata"));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: (theme) => ({
          overflow: "hidden",
          backgroundImage:
            "radial-gradient(circle at top left, rgba(255,0,0,.18), transparent 34%), linear-gradient(135deg, rgba(255,255,255,.04), transparent)",
          border: `1px solid ${theme.design.color.border}`,
          maxHeight: "calc(100% - 32px)"
        })
      }}
    >
      <DialogTitle component="div" sx={{ pb: 1 }}>
        <Typography variant="overline" color="error.light">
          YouTube import
        </Typography>
        <Typography component="h2" variant="h5" fontWeight={900}>
          Add YouTube video
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(280px, 360px) minmax(0, 1fr)" },
            gap: 3,
            alignItems: "start"
          }}
        >
          <Stack spacing={2}>
            <Box
              sx={(theme) => ({
                p: 1.5,
                borderRadius: `${theme.design.radius.card}px`,
                bgcolor: "rgba(255,255,255,.05)",
                border: `1px solid ${theme.design.color.border}`,
                boxShadow: theme.design.shadow.card
              })}
            >
              <MediaCard
                title={draft.title || "Your YouTube video"}
                aspect="landscape"
                onOpen={() => undefined}
                artwork={
                  coverPreviewUrl ? (
                    <Box component="img" src={coverPreviewUrl} alt={draft.title || "Video cover"} />
                  ) : (
                    <Stack alignItems="center" spacing={1} sx={{ color: "text.secondary" }}>
                      <YouTubeIcon sx={{ fontSize: 56, color: "error.main" }} />
                      <Typography variant="body2">Load a YouTube URL</Typography>
                    </Stack>
                  )
                }
                trailingAction={
                  <Box
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: 999,
                      bgcolor: "error.main",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 800,
                      pointerEvents: "none"
                    }}
                  >
                    YouTube
                  </Box>
                }
                secondary={
                  <Typography noWrap color="text.secondary" fontSize={13} title={draft.artist}>
                    {draft.artist || "Channel / artist appears here"}
                  </Typography>
                }
              />
            </Box>
            <Box
              sx={(theme) => ({
                p: 2,
                borderRadius: `${theme.design.radius.card}px`,
                bgcolor: theme.design.color.surfaceHover,
                border: `1px solid ${theme.design.color.border}`
              })}
            >
              <Typography fontWeight={800}>Preview status</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {loaded
                  ? "Metadata loaded. Tune the fields, artwork, and chapters before saving."
                  : "Paste a YouTube URL and load metadata to compose the admin record."}
              </Typography>
              <Button
                component="label"
                variant={coverFile ? "contained" : "outlined"}
                startIcon={<PhotoCameraIcon />}
                sx={{ mt: 2 }}
              >
                {coverFile ? "Replace cover" : "Choose cover"}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
                />
              </Button>
            </Box>
          </Stack>

          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr auto" },
                gap: 1.5
              }}
            >
              <TextField
                label="YouTube URL"
                value={draft.youtubeUrl}
                onChange={(event) => {
                  setLoaded(false);
                  setDraft({ ...draft, youtubeUrl: event.target.value });
                }}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <Button
                variant="contained"
                color="error"
                startIcon={<YouTubeIcon />}
                onClick={loadFromYoutube}
                disabled={busy || !draft.youtubeUrl.trim()}
                sx={{ minWidth: 170 }}
              >
                {loadMetadata.isPending ? "Loading..." : "Load"}
              </Button>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 150px 150px" },
                gap: 2
              }}
            >
              <TextField
                label="Title"
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                sx={{ gridColumn: { sm: "1 / -1" } }}
              />
              <TextField
                label="Artists"
                value={draft.artist}
                helperText="Defaults to the YouTube channel; comma separated"
                onChange={(event) => setDraft({ ...draft, artist: event.target.value })}
                sx={{ gridColumn: { sm: "1 / -1" } }}
              />
              <TextField
                label="Genres"
                value={draft.genre}
                helperText="Comma separated"
                onChange={(event) => setDraft({ ...draft, genre: event.target.value })}
              />
              <TextField
                label="Release year"
                type="number"
                value={draft.year}
                onChange={(event) => setDraft({ ...draft, year: event.target.value })}
              />
              <TextField
                label="Duration"
                type="number"
                value={draft.duration}
                helperText="Seconds"
                onChange={(event) => setDraft({ ...draft, duration: event.target.value })}
              />
            </Box>

            <Box
              sx={(theme) => ({
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                gap: 1.5,
                p: 2,
                borderRadius: `${theme.design.radius.card}px`,
                bgcolor: "rgba(255,255,255,.035)",
                border: `1px solid ${theme.design.color.border}`
              })}
            >
              <Typography variant="overline" color="text.secondary" sx={{ gridColumn: "1 / -1" }}>
                Technical metadata from yt-dlp
              </Typography>
              <TextField
                label="Video codec"
                value={draft.videoCodecRaw}
                onChange={(event) => setDraft({ ...draft, videoCodecRaw: event.target.value })}
              />
              <TextField
                label="Audio codec"
                value={draft.audioCodecRaw}
                onChange={(event) => setDraft({ ...draft, audioCodecRaw: event.target.value })}
              />
              <TextField
                label="Container"
                value={draft.fileExtension}
                onChange={(event) => setDraft({ ...draft, fileExtension: event.target.value })}
              />
              <TextField
                label="Audio sample rate"
                type="number"
                value={draft.audioSampleRate}
                helperText="yt-dlp asr"
                onChange={(event) => setDraft({ ...draft, audioSampleRate: event.target.value })}
              />
              <TextField
                label="Bitrate"
                type="number"
                value={draft.bitrate}
                helperText="bps"
                onChange={(event) => setDraft({ ...draft, bitrate: event.target.value })}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  Subtitles
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 0.75 }}>
                  {subtitles.length ? (
                    subtitles
                      .slice(0, 8)
                      .map((subtitle) => (
                        <Chip
                          key={`${subtitle.automatic ? "auto" : "manual"}-${subtitle.language}`}
                          size="small"
                          label={`${subtitle.language}${subtitle.ext ? ` .${subtitle.ext}` : ""}${
                            subtitle.automatic ? " auto" : ""
                          }`}
                        />
                      ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      None found
                    </Typography>
                  )}
                  {subtitles.length > 8 && <Chip size="small" label={`+${subtitles.length - 8}`} />}
                </Stack>
              </Box>
            </Box>

            <YoutubeLyricsPreviewPanel
              rows={lyricsPreviewRows}
              loading={previewLyrics.isPending}
              error={lyricsPreviewError}
              subtitleCount={subtitles.length}
            />

            <Divider />
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
              spacing={1.5}
            >
              <Box>
                <Typography variant="h6" fontWeight={850}>
                  Chapters
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {draft.chapters.length} imported marker{draft.chapters.length === 1 ? "" : "s"}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button component="label" size="small" variant="outlined">
                  Import CSV
                  <input
                    hidden
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      setDraft({ ...draft, chapters: parseChapterCsv(await file.text()) ?? [] });
                    }}
                  />
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      chapters: [...draft.chapters, { time: 0, title: "", subTitle: "" }]
                    })
                  }
                >
                  Add chapter
                </Button>
              </Stack>
            </Stack>
            <TableContainer
              sx={(theme) => ({
                maxHeight: 260,
                border: `1px solid ${theme.design.color.border}`,
                borderRadius: `${theme.design.radius.card}px`
              })}
            >
              <Table size="small" aria-label="YouTube video chapters table" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell width={130}>Time</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Subtitle</TableCell>
                    <TableCell width={52}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {draft.chapters.map((chapter, index) => (
                    <TableRow key={`${chapter.time}-${index}`}>
                      <TableCell>
                        <TextField
                          size="small"
                          value={chapter.time}
                          onChange={(event) => {
                            const chapters = [...draft.chapters];
                            chapters[index] = {
                              ...chapter,
                              time: parseChapterTime(event.target.value)
                            };
                            setDraft({ ...draft, chapters });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={chapter.title}
                          onChange={(event) => {
                            const chapters = [...draft.chapters];
                            chapters[index] = { ...chapter, title: event.target.value };
                            setDraft({ ...draft, chapters });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={chapter.subTitle ?? ""}
                          onChange={(event) => {
                            const chapters = [...draft.chapters];
                            chapters[index] = { ...chapter, subTitle: event.target.value };
                            setDraft({ ...draft, chapters });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          aria-label="Delete chapter"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              chapters: draft.chapters.filter(
                                (_item, itemIndex) => itemIndex !== index
                              )
                            })
                          }
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={!canSave || busy}
          onClick={async () => {
            setError("");
            try {
              await createVideo.mutateAsync({
                metadata: {
                  title: draft.title.trim(),
                  artists: splitList(draft.artist),
                  genres: splitList(draft.genre),
                  year: draft.year ? Number(draft.year) : undefined,
                  youtubeUrl: draft.youtubeUrl.trim(),
                  duration,
                  videoCodecRaw: draft.videoCodecRaw.trim() || undefined,
                  audioCodecRaw: draft.audioCodecRaw.trim() || undefined,
                  audioSampleRate: draft.audioSampleRate
                    ? Number(draft.audioSampleRate)
                    : undefined,
                  bitrate: draft.bitrate ? Number(draft.bitrate) : undefined,
                  fileExtension: draft.fileExtension.trim() || undefined,
                  chapters: draft.chapters,
                  subtitles
                },
                cover: coverFile ?? undefined
              });
              onClose();
            } catch (saveError) {
              setError(errorMessage(saveError, "Could not save YouTube video"));
            }
          }}
        >
          {createVideo.isPending ? "Saving..." : "Save YouTube video"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function AlbumEditDialog({
  album,
  open,
  onClose
}: {
  album: AdminAlbum | null;
  open: boolean;
  onClose: () => void;
}) {
  const update = useUpdateAdminAlbum();
  const updateCover = useUpdateAdminAlbumCover();
  const [draft, setDraft] = React.useState({ title: "", artist: "", genre: "", year: "" });
  const [coverFile, setCoverFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    setDraft({
      title: album?.title ?? "",
      artist: album?.artist ?? "",
      genre: album?.genre?.join(", ") ?? "",
      year: album?.year?.toString() ?? ""
    });
    setCoverFile(null);
  }, [album]);

  if (!album) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit album metadata</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "grid", gridTemplateColumns: "230px 1fr", gap: 3, mt: 1 }}>
          <Stack spacing={2} alignItems="stretch">
            <Box
              component="img"
              src={
                coverFile
                  ? URL.createObjectURL(coverFile)
                  : album.hasCover
                    ? apiAssetUrl(`/album/${album._id}/cover`)
                    : undefined
              }
              alt=""
              sx={{
                width: 225,
                height: 225,
                objectFit: "cover",
                bgcolor: "#18181c",
                borderRadius: 1,
                border: "1px solid rgba(255,255,255,.12)"
              }}
            />
            <Button component="label" variant="contained" sx={{ borderRadius: 2, py: 1.4 }}>
              Change image
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
              />
            </Button>
          </Stack>
          <Stack spacing={2}>
            <TextField
              label="Title"
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
            <TextField
              label="Artist"
              value={draft.artist}
              onChange={(event) => setDraft({ ...draft, artist: event.target.value })}
            />
            <TextField
              label="Genre"
              helperText="Comma separated"
              value={draft.genre}
              onChange={(event) => setDraft({ ...draft, genre: event.target.value })}
            />
            <TextField
              label="Year"
              type="number"
              value={draft.year}
              onChange={(event) => setDraft({ ...draft, year: event.target.value })}
            />
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={async () => {
            await update.mutateAsync({
              id: album._id,
              data: {
                title: draft.title,
                artist: draft.artist,
                genre: splitList(draft.genre),
                year: draft.year ? Number(draft.year) : undefined
              }
            });
            if (coverFile) await updateCover.mutateAsync({ id: album._id, file: coverFile });
            onClose();
          }}
          disabled={update.isPending || updateCover.isPending}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function AlbumMediaDialog({
  album,
  open,
  onClose
}: {
  album: AdminAlbum | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!album) return null;
  const rows = [
    ...(album.trackList ?? []).map((item) => ({ ...item, id: item._id, type: "Song" }))
  ];
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{album.title} media</DialogTitle>
      <DialogContent>
        <AdminTable
          ariaLabel="Album media table"
          rows={rows}
          columns={[
            { key: "type", label: "Type", width: 100, render: (row) => row.type },
            { key: "title", label: "Title", render: (row) => row.title },
            { key: "id", label: "ID", width: 210, render: (row) => row._id }
          ]}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export function HostEditDialog({
  host,
  open,
  onClose
}: {
  host: AdminHost | null;
  open: boolean;
  onClose: () => void;
}) {
  const save = useSaveAdminHost();
  const [draft, setDraft] = React.useState({
    name: "",
    provider: "infinityfree.net",
    host: "",
    path: "/audio",
    ftpRoot: "/htdocs",
    ftpLimit: "10000000",
    ftpHost: "",
    ftpPort: "21",
    ftpUser: "",
    ftpPassword: ""
  });

  React.useEffect(() => {
    setDraft({
      name: host?.name ?? "",
      provider: host?.provider || "infinityfree.net",
      host: host?.host ?? "",
      path: host?.path || "/audio",
      ftpRoot: host?.ftpRoot || "/htdocs",
      ftpLimit: host?.ftpLimit?.toString() || "10000000",
      ftpHost: "",
      ftpPort: "21",
      ftpUser: "",
      ftpPassword: ""
    });
  }, [host]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{host ? "Edit hosting provider" : "Add hosting provider"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
          <TextField
            label="Provider"
            value={draft.provider}
            onChange={(event) => setDraft({ ...draft, provider: event.target.value })}
          />
          <TextField
            label="Stream host"
            value={draft.host}
            onChange={(event) => setDraft({ ...draft, host: event.target.value })}
          />
          <TextField
            label="Path"
            value={draft.path}
            onChange={(event) => setDraft({ ...draft, path: event.target.value })}
          />
          {!host && (
            <>
              <Divider />
              <TextField
                label="FTP host"
                value={draft.ftpHost}
                onChange={(event) => setDraft({ ...draft, ftpHost: event.target.value })}
              />
              <TextField
                label="FTP port"
                type="number"
                value={draft.ftpPort}
                onChange={(event) => setDraft({ ...draft, ftpPort: event.target.value })}
              />
              <TextField
                label="FTP username"
                value={draft.ftpUser}
                onChange={(event) => setDraft({ ...draft, ftpUser: event.target.value })}
              />
              <TextField
                label="FTP password"
                type="password"
                value={draft.ftpPassword}
                onChange={(event) => setDraft({ ...draft, ftpPassword: event.target.value })}
              />
              <TextField
                label="FTP root"
                value={draft.ftpRoot}
                onChange={(event) => setDraft({ ...draft, ftpRoot: event.target.value })}
              />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={() =>
            save.mutate(
              {
                id: host?._id,
                data: {
                  name: draft.name,
                  provider: draft.provider,
                  host: draft.host,
                  path: draft.path,
                  ftpRoot: draft.ftpRoot,
                  ftpLimit: Number(draft.ftpLimit),
                  ftpCredential: {
                    host: draft.ftpHost,
                    port: Number(draft.ftpPort),
                    user: draft.ftpUser,
                    password: draft.ftpPassword
                  }
                }
              },
              { onSuccess: onClose }
            )
          }
          disabled={save.isPending}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ArtistEditDialog({
  artist,
  open,
  onClose
}: {
  artist: AdminArtist | null;
  open: boolean;
  onClose: () => void;
}) {
  const rename = useRenameAdminArtist();
  const updateImage = useUpdateAdminArtistImage();
  const [name, setName] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    setName(artist?.name ?? "");
    setFile(null);
  }, [artist]);

  if (!artist) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit artist</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "grid", gridTemplateColumns: "230px 1fr", gap: 3, mt: 1 }}>
          <Stack spacing={2} alignItems="stretch">
            <Box
              component="img"
              src={
                file
                  ? URL.createObjectURL(file)
                  : artist.hasImage
                    ? artistImageUrl(artist.name)
                    : undefined
              }
              alt=""
              sx={{
                width: 225,
                height: 225,
                objectFit: "cover",
                bgcolor: "#18181c",
                borderRadius: 1,
                border: "1px solid rgba(255,255,255,.12)"
              }}
            />
            <Button
              component="label"
              startIcon={<ImageIcon />}
              variant="contained"
              sx={{ borderRadius: 2, py: 1.4 }}
            >
              Change image
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </Button>
          </Stack>
          <Stack spacing={2}>
            <TextField
              label="Canonical artist name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Box
              sx={{
                border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 1.5,
                p: 2,
                minHeight: 120,
                color: "text.secondary"
              }}
            >
              <Typography fontWeight={700} color="text.primary">
                Merge duplicate artist names
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Saving a different name replaces this artist string across songs, videos, and
                albums.
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                Songs {artist.songCount} · Videos {artist.videoCount} · Albums {artist.albumCount}
              </Typography>
            </Box>
            {file && <Typography variant="caption">{file.name}</Typography>}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          disabled={rename.isPending || updateImage.isPending}
          onClick={async () => {
            if (name !== artist.name) await rename.mutateAsync({ from: artist.name, name });
            if (file) await updateImage.mutateAsync({ name, file });
            onClose();
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function UploadMediaDialog({
  open,
  hosts,
  onClose,
  onUploaded
}: {
  open: boolean;
  hosts: AdminHost[];
  onClose: () => void;
  onUploaded: (media: AdminSong | AdminVideo, type: "song" | "video") => void;
}) {
  const upload = useUploadAdminMedia();
  const [hostId, setHostId] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState("");
  const [progress, setProgress] = React.useState<{
    status: string;
    part?: number;
    total?: number;
    message?: string;
  } | null>(null);
  const progressSourceRef = React.useRef<EventSource | null>(null);

  React.useEffect(() => {
    if (open) {
      setHostId(hosts[0]?._id ?? "");
      setFile(null);
      setError("");
      setProgress(null);
    }
  }, [hosts, open]);

  React.useEffect(
    () => () => {
      progressSourceRef.current?.close();
    },
    []
  );

  const chooseFiles = (files: FileList | null) => {
    setFile(files?.[0] ?? null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload media</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <InputLabel id="upload-host-label">Hosting provider</InputLabel>
          <Select
            labelId="upload-host-label"
            value={hostId}
            onChange={(event: SelectChangeEvent) => setHostId(event.target.value)}
          >
            {hosts.map((host) => (
              <MenuItem key={host._id} value={host._id}>
                {host.name}
              </MenuItem>
            ))}
          </Select>
          <Box
            onDrop={(event) => {
              event.preventDefault();
              chooseFiles(event.dataTransfer.files);
            }}
            onDragOver={(event) => event.preventDefault()}
            sx={{
              border: "1px dashed rgba(255,255,255,.32)",
              borderRadius: 1,
              minHeight: 150,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              bgcolor: "rgba(255,255,255,.03)"
            }}
          >
            <Stack spacing={1} alignItems="center">
              <CloudUploadIcon />
              <Typography>{file ? file.name : "Drop a media file here"}</Typography>
              <Button component="label" variant="outlined">
                Browse
                <input
                  hidden
                  type="file"
                  accept="audio/*,video/*"
                  onChange={(event) => chooseFiles(event.target.files)}
                />
              </Button>
            </Stack>
          </Box>
          {progress && (
            <Box>
              <LinearProgress
                variant={progress.total ? "determinate" : "indeterminate"}
                value={progress.total ? ((progress.part ?? 0) / progress.total) * 100 : undefined}
              />
              <Typography variant="caption" color="text.secondary">
                {progress.status}
                {progress.total ? ` ${progress.part ?? 0}/${progress.total}` : ""}
                {progress.message ? ` - ${progress.message}` : ""}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          disabled={!hostId || !file || upload.isPending}
          onClick={async () => {
            if (!file) return;
            setError("");
            try {
              const progressId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
              progressSourceRef.current?.close();
              const source = new EventSource(uploadProgressUrl(progressId));
              progressSourceRef.current = source;
              source.onmessage = (event) => setProgress(JSON.parse(event.data));
              const result = await upload.mutateAsync({ hostId, file, progressId });
              source.close();
              const media =
                result.type === "song"
                  ? (await listAdminSongs()).find((song) => song._id === result.id)
                  : (await listAdminVideos()).find((video) => video._id === result.id);
              if (media) onUploaded(media, result.type);
              onClose();
            } catch (error) {
              progressSourceRef.current?.close();
              setError(error instanceof Error ? error.message : String(error));
            }
          }}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}
