import React from "react";
import {
  Alert,
  Box,
  Button,
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
import { apiAssetUrl } from "@lib/axios";
import { artistImageUrl } from "@utils/artist";
import {
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
import type { AdminAlbum, AdminArtist, AdminHost, AdminSong, AdminVideo } from "../types";
import {
  joinArtists,
  parseChapterCsv,
  parseChapterTime,
  splitList
} from "../utils/adminFormatting";
import { AdminTable } from "./AdminPrimitives";

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
