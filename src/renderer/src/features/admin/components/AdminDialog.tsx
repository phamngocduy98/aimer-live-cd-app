import React from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import EditIcon from "@mui/icons-material/Edit";
import ImageIcon from "@mui/icons-material/Image";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import MovieIcon from "@mui/icons-material/Movie";
import AlbumIcon from "@mui/icons-material/Album";
import GroupsIcon from "@mui/icons-material/Groups";
import DnsIcon from "@mui/icons-material/Dns";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloseIcon from "@mui/icons-material/Close";
import { apiAssetUrl } from "@lib/axios";
import { artistImageUrl } from "@utils/artist";
import {
  useAdminAlbums,
  useAdminArtists,
  useAdminHosts,
  useAdminSongs,
  useAdminUploads,
  useAdminVideos,
  useDeleteAdminAlbum,
  useDeleteAdminHost,
  useDeleteAdminSong,
  useDeleteAdminVideo,
  useRenameAdminArtist,
  useSaveAdminHost,
  useUpdateAdminAlbum,
  useUpdateAdminAlbumCover,
  useUpdateAdminArtistImage,
  useUpdateAdminSong,
  useUpdateAdminVideo,
  useUploadAdminMedia
} from "../hooks/useAdmin";
import { listAdminSongs, listAdminVideos, uploadProgressUrl } from "../api/admin";
import type {
  AdminAlbum,
  AdminArtist,
  AdminHost,
  AdminSong,
  AdminTab,
  AdminUpload,
  AdminVideo
} from "../types";

interface AdminDialogProps {
  open: boolean;
  onClose: () => void;
}

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

function joinArtists(artists?: string[]): string {
  return artists?.join(", ") || "";
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseChapterTime(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  const parts = trimmed.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function parseChapterCsv(text: string): AdminVideo["chapters"] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [time = "0", title = "", subTitle = ""] = line.split(",").map((cell) => cell.trim());
      return { time: parseChapterTime(time), title, subTitle };
    });
}

function AdminTable<T extends { _id?: string; id?: string }>({
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

function AdminNavigation({ value, onChange }: { value: AdminTab; onChange: (tab: AdminTab) => void }) {
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

function Actions({
  onEdit,
  onDelete
}: {
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
      {onEdit && (
        <IconButton size="small" aria-label="Edit" onClick={onEdit}>
          <EditIcon fontSize="small" />
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

function ConfirmDialog({
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

function SongEditDialog({
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
          <TextField label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <TextField label="Artists" value={draft.artist} helperText="Comma separated" onChange={(e) => setDraft({ ...draft, artist: e.target.value })} />
          <TextField label="Track number" type="number" value={draft.trackNo} onChange={(e) => setDraft({ ...draft, trackNo: e.target.value })} />
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

function VideoEditDialog({
  video,
  albums,
  open,
  onClose
}: {
  video: AdminVideo | null;
  albums: AdminAlbum[];
  open: boolean;
  onClose: () => void;
}) {
  const update = useUpdateAdminVideo();
  const [draft, setDraft] = React.useState({
    title: "",
    artist: "",
    album: "",
    chapters: [] as NonNullable<AdminVideo["chapters"]>
  });
  React.useEffect(() => {
    setDraft({
      title: video?.title ?? "",
      artist: joinArtists(video?.artist),
      album: video?.album?._id ?? "",
      chapters: video?.chapters ?? []
    });
  }, [video]);
  if (!video) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit video metadata</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <TextField label="Artists" value={draft.artist} helperText="Comma separated" onChange={(e) => setDraft({ ...draft, artist: e.target.value })} />
          <InputLabel id="video-album-label">Album</InputLabel>
          <Select
            labelId="video-album-label"
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
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography fontWeight={700}>Chapters</Typography>
            <Stack direction="row" spacing={1}>
              <Button
                component="label"
                size="small"
                variant="outlined"
              >
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
          <TableContainer sx={{ maxHeight: 240, border: "1px solid rgba(255,255,255,.1)" }}>
            <Table size="small" aria-label="Video chapters table" stickyHeader>
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
                          chapters[index] = { ...chapter, time: parseChapterTime(event.target.value) };
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
                            chapters: draft.chapters.filter((_item, itemIndex) => itemIndex !== index)
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
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => {
            update.mutate(
              {
                id: video._id,
                data: {
                  title: draft.title,
                  artist: splitList(draft.artist),
                  album: draft.album as unknown as AdminAlbum,
                  chapters: draft.chapters
                }
              },
              { onSuccess: onClose }
            );
          }}
          disabled={update.isPending}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AlbumEditDialog({
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
            <TextField label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <TextField label="Artist" value={draft.artist} onChange={(e) => setDraft({ ...draft, artist: e.target.value })} />
            <TextField label="Genre" helperText="Comma separated" value={draft.genre} onChange={(e) => setDraft({ ...draft, genre: e.target.value })} />
            <TextField label="Year" type="number" value={draft.year} onChange={(e) => setDraft({ ...draft, year: e.target.value })} />
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={async () => {
            await update.mutateAsync(
              {
                id: album._id,
                data: {
                  title: draft.title,
                  artist: draft.artist,
                  genre: splitList(draft.genre),
                  year: draft.year ? Number(draft.year) : undefined
                }
              }
            );
            if (coverFile) {
              await updateCover.mutateAsync({ id: album._id, file: coverFile });
            }
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

function AlbumMediaDialog({
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
    ...(album.trackList ?? []).map((item) => ({ ...item, id: item._id, type: "Song" })),
    ...(album.videoList ?? []).map((item) => ({ ...item, id: item._id, type: "Video" }))
  ];
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{album.title} media</DialogTitle>
      <DialogContent>
        <AdminTable<{ id: string; _id: string; title: string; type: string }>
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

function HostEditDialog({
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
          <TextField label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <TextField label="Provider" value={draft.provider} onChange={(e) => setDraft({ ...draft, provider: e.target.value })} />
          <TextField label="Stream host" value={draft.host} onChange={(e) => setDraft({ ...draft, host: e.target.value })} />
          <TextField label="Path" value={draft.path} onChange={(e) => setDraft({ ...draft, path: e.target.value })} />
          {!host && (
            <>
              <Divider />
              <TextField label="FTP host" value={draft.ftpHost} onChange={(e) => setDraft({ ...draft, ftpHost: e.target.value })} />
              <TextField label="FTP port" type="number" value={draft.ftpPort} onChange={(e) => setDraft({ ...draft, ftpPort: e.target.value })} />
              <TextField label="FTP username" value={draft.ftpUser} onChange={(e) => setDraft({ ...draft, ftpUser: e.target.value })} />
              <TextField label="FTP password" type="password" value={draft.ftpPassword} onChange={(e) => setDraft({ ...draft, ftpPassword: e.target.value })} />
              <TextField label="FTP root" value={draft.ftpRoot} onChange={(e) => setDraft({ ...draft, ftpRoot: e.target.value })} />
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

function ArtistEditDialog({
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
            <Button component="label" startIcon={<ImageIcon />} variant="contained" sx={{ borderRadius: 2, py: 1.4 }}>
              Change image
              <input hidden type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            </Button>
          </Stack>
          <Stack spacing={2}>
            <TextField label="Canonical artist name" value={name} onChange={(e) => setName(e.target.value)} />
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
                Saving a different name replaces this artist string across songs, videos, and albums.
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
            if (name !== artist.name) {
              await rename.mutateAsync({ from: artist.name, name });
            }
            if (file) {
              await updateImage.mutateAsync({ name, file });
            }
            onClose();
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function UploadMediaDialog({
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
                <input hidden type="file" accept="audio/*,video/*" onChange={(event) => chooseFiles(event.target.files)} />
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
              source.onmessage = (event) => {
                setProgress(JSON.parse(event.data));
              };
              const result = await upload.mutateAsync({ hostId, file, progressId });
              source.close();
              const media =
                result.type === "song"
                  ? (await listAdminSongs()).find((song) => song._id === result.id)
                  : (await listAdminVideos()).find((video) => video._id === result.id);
              if (media) onUploaded(media, result.type);
              onClose();
            } catch (err) {
              progressSourceRef.current?.close();
              setError(err instanceof Error ? err.message : String(err));
            }
          }}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function AdminDialog({ open, onClose }: AdminDialogProps) {
  const [tab, setTab] = React.useState<AdminTab>("uploads");
  const uploads = useAdminUploads();
  const songs = useAdminSongs();
  const videos = useAdminVideos();
  const albums = useAdminAlbums();
  const artists = useAdminArtists();
  const hosts = useAdminHosts();
  const deleteSong = useDeleteAdminSong();
  const deleteVideo = useDeleteAdminVideo();
  const deleteAlbum = useDeleteAdminAlbum();
  const deleteHost = useDeleteAdminHost();
  const [songEdit, setSongEdit] = React.useState<AdminSong | null>(null);
  const [videoEdit, setVideoEdit] = React.useState<AdminVideo | null>(null);
  const [albumEdit, setAlbumEdit] = React.useState<AdminAlbum | null>(null);
  const [albumMedia, setAlbumMedia] = React.useState<AdminAlbum | null>(null);
  const [artistEdit, setArtistEdit] = React.useState<AdminArtist | null>(null);
  const [hostEdit, setHostEdit] = React.useState<AdminHost | null | undefined>(undefined);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<
    | { type: "song"; item: AdminSong }
    | { type: "video"; item: AdminVideo }
    | { type: "album"; item: AdminAlbum }
    | { type: "host"; item: AdminHost }
    | null
  >(null);

  const albumRows = albums.data ?? [];
  const hostRows = hosts.data ?? [];

  const content = {
    uploads: (
      <Stack sx={{ height: "100%" }} spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Uploads</Typography>
          <Button startIcon={<CloudUploadIcon />} variant="contained" onClick={() => setUploadOpen(true)}>
            Upload media
          </Button>
        </Stack>
        <AdminTable<AdminUpload>
          ariaLabel="Admin uploads table"
          loading={uploads.isLoading}
          rows={uploads.data ?? []}
          columns={[
            { key: "id", label: "ID", width: 210, render: (row) => row.id },
            { key: "name", label: "Song/Video name", render: (row) => row.name },
            {
              key: "health",
              label: "Health",
              width: 150,
              render: (row) => (
                <Chip
                  size="small"
                  label={row.healthy ? "Healthy" : row.health === "unknown" ? "Unknown" : "Missing parts"}
                  color={row.healthy ? "success" : "warning"}
                />
              )
            },
            { key: "ha", label: "HA", width: 90, render: (row) => `x${row.ha}` }
          ]}
        />
      </Stack>
    ),
    songs: (
      <AdminTable<AdminSong>
        ariaLabel="Admin songs table"
        loading={songs.isLoading}
        rows={songs.data ?? []}
        columns={[
          { key: "title", label: "Title", render: (row) => row.title },
          { key: "artist", label: "Artist", render: (row) => joinArtists(row.artist) },
          { key: "album", label: "Album", render: (row) => row.album?.title ?? "" },
          { key: "track", label: "Track", width: 80, render: (row) => row.trackNo ?? "" },
          { key: "hosts", label: "HA", width: 80, render: (row) => `x${row.hostingList?.length ?? 0}` },
          {
            key: "actions",
            label: "",
            width: 96,
            render: (row) => <Actions onEdit={() => setSongEdit(row)} onDelete={() => setDeleteTarget({ type: "song", item: row })} />
          }
        ]}
      />
    ),
    videos: (
      <AdminTable<AdminVideo>
        ariaLabel="Admin videos table"
        loading={videos.isLoading}
        rows={videos.data ?? []}
        columns={[
          { key: "title", label: "Title", render: (row) => row.title },
          { key: "artist", label: "Artist", render: (row) => joinArtists(row.artist) },
          { key: "album", label: "Album", render: (row) => row.album?.title ?? "" },
          { key: "format", label: "Format", width: 100, render: (row) => row.format ?? "" },
          { key: "hosts", label: "HA", width: 80, render: (row) => `x${row.hostingList?.length ?? 0}` },
          {
            key: "actions",
            label: "",
            width: 96,
            render: (row) => <Actions onEdit={() => setVideoEdit(row)} onDelete={() => setDeleteTarget({ type: "video", item: row })} />
          }
        ]}
      />
    ),
    albums: (
      <AdminTable<AdminAlbum>
        ariaLabel="Admin albums table"
        loading={albums.isLoading}
        rows={albumRows}
        columns={[
          { key: "title", label: "Title", render: (row) => row.title },
          { key: "artist", label: "Artist", render: (row) => row.artist ?? "" },
          { key: "year", label: "Year", width: 80, render: (row) => row.year ?? "" },
          {
            key: "songs",
            label: "Songs",
            width: 90,
            render: (row) => (
              <Button size="small" onClick={() => setAlbumMedia(row)}>
                {row.trackList?.length ?? 0}
              </Button>
            )
          },
          {
            key: "videos",
            label: "Videos",
            width: 90,
            render: (row) => (
              <Button size="small" onClick={() => setAlbumMedia(row)}>
                {row.videoList?.length ?? 0}
              </Button>
            )
          },
          {
            key: "actions",
            label: "",
            width: 96,
            render: (row) => <Actions onEdit={() => setAlbumEdit(row)} onDelete={() => setDeleteTarget({ type: "album", item: row })} />
          }
        ]}
      />
    ),
    artists: (
      <AdminTable<AdminArtist & { id: string }>
        ariaLabel="Admin artists table"
        loading={artists.isLoading}
        rows={(artists.data ?? []).map((artist) => ({ ...artist, id: artist.name }))}
        columns={[
          {
            key: "image",
            label: "Image",
            width: 80,
            render: (row) => (
              <Avatar src={row.hasImage ? artistImageUrl(row.name) : undefined}>
                {row.name.slice(0, 1)}
              </Avatar>
            )
          },
          { key: "name", label: "Artist", render: (row) => row.name },
          { key: "songs", label: "Songs", width: 90, render: (row) => row.songCount },
          { key: "videos", label: "Videos", width: 90, render: (row) => row.videoCount },
          { key: "albums", label: "Albums", width: 90, render: (row) => row.albumCount },
          {
            key: "actions",
            label: "",
            width: 64,
            render: (row) => <Actions onEdit={() => setArtistEdit(row)} />
          }
        ]}
      />
    ),
    hosts: (
      <Stack sx={{ height: "100%" }} spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Hosting Provider</Typography>
          <Button variant="contained" onClick={() => setHostEdit(null)}>
            Add host
          </Button>
        </Stack>
        <AdminTable<AdminHost>
          ariaLabel="Admin hosting providers table"
          loading={hosts.isLoading}
          rows={hostRows}
          columns={[
            { key: "name", label: "Name", render: (row) => row.name },
            { key: "provider", label: "Provider", render: (row) => row.provider ?? "" },
            { key: "host", label: "Host", render: (row) => row.host ?? "" },
            { key: "path", label: "Path", width: 120, render: (row) => row.path ?? "" },
            {
              key: "actions",
              label: "",
              width: 96,
              render: (row) => <Actions onEdit={() => setHostEdit(row)} onDelete={() => setDeleteTarget({ type: "host", item: row })} />
            }
          ]}
        />
      </Stack>
    )
  }[tab];

  const deleteMessage =
    deleteTarget?.type === "song" || deleteTarget?.type === "video"
      ? "Remote media files will be deleted first. Metadata will remain if remote cleanup fails."
      : "This deletes the selected admin record and updates references where needed.";

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} aria-labelledby="admin-dialog-title">
      <Box sx={{ width: 1120, height: 720, bgcolor: "#080808", color: "#fff", display: "flex", flexDirection: "column" }}>
        <DialogTitle id="admin-dialog-title" sx={{ display: "flex", alignItems: "center", pr: 1 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Admin
          </Typography>
          <IconButton aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <Box sx={{ display: "flex", minHeight: 0, flex: 1 }}>
          <AdminNavigation value={tab} onChange={setTab} />
          <DialogContent sx={{ p: 2, minWidth: 0, flex: 1, height: "100%" }}>{content}</DialogContent>
        </Box>
      </Box>
      <SongEditDialog song={songEdit} albums={albumRows} open={Boolean(songEdit)} onClose={() => setSongEdit(null)} />
      <VideoEditDialog video={videoEdit} albums={albumRows} open={Boolean(videoEdit)} onClose={() => setVideoEdit(null)} />
      <AlbumEditDialog album={albumEdit} open={Boolean(albumEdit)} onClose={() => setAlbumEdit(null)} />
      <AlbumMediaDialog album={albumMedia} open={Boolean(albumMedia)} onClose={() => setAlbumMedia(null)} />
      <ArtistEditDialog artist={artistEdit} open={Boolean(artistEdit)} onClose={() => setArtistEdit(null)} />
      <HostEditDialog host={hostEdit ?? null} open={hostEdit !== undefined} onClose={() => setHostEdit(undefined)} />
      <UploadMediaDialog
        open={uploadOpen}
        hosts={hostRows}
        onClose={() => setUploadOpen(false)}
        onUploaded={(media, type) => {
          if (type === "song") setSongEdit(media as AdminSong);
          else setVideoEdit(media as AdminVideo);
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Confirm delete"
        message={deleteMessage}
        pending={deleteSong.isPending || deleteVideo.isPending || deleteAlbum.isPending || deleteHost.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          const onSuccess = () => setDeleteTarget(null);
          if (deleteTarget.type === "song") deleteSong.mutate(deleteTarget.item._id, { onSuccess });
          if (deleteTarget.type === "video") deleteVideo.mutate(deleteTarget.item._id, { onSuccess });
          if (deleteTarget.type === "album") deleteAlbum.mutate(deleteTarget.item._id, { onSuccess });
          if (deleteTarget.type === "host") deleteHost.mutate(deleteTarget.item._id, { onSuccess });
        }}
      />
    </Dialog>
  );
}
