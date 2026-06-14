import { Avatar, Button, Chip, Stack, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { artistImageUrl } from "@utils/artist";
import type {
  AdminAlbum,
  AdminArtist,
  AdminHost,
  AdminSong,
  AdminUpload,
  AdminVideo
} from "../types";
import { joinArtists } from "../utils/adminFormatting";
import { AdminActions, AdminTable } from "./AdminPrimitives";

export function UploadsSection({
  rows,
  loading,
  onUpload
}: {
  rows: AdminUpload[];
  loading: boolean;
  onUpload: () => void;
}) {
  return (
    <Stack sx={{ height: "100%" }} spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Uploads</Typography>
        <Button startIcon={<CloudUploadIcon />} variant="contained" onClick={onUpload}>
          Upload media
        </Button>
      </Stack>
      <AdminTable
        ariaLabel="Admin uploads table"
        loading={loading}
        rows={rows}
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
                label={
                  row.healthy ? "Healthy" : row.health === "unknown" ? "Unknown" : "Missing parts"
                }
                color={row.healthy ? "success" : "warning"}
              />
            )
          },
          { key: "ha", label: "HA", width: 90, render: (row) => `x${row.ha}` }
        ]}
      />
    </Stack>
  );
}

export function SongsSection({
  rows,
  loading,
  onEdit,
  onLyrics,
  onDelete
}: {
  rows: AdminSong[];
  loading: boolean;
  onEdit: (song: AdminSong) => void;
  onLyrics: (song: AdminSong) => void;
  onDelete: (song: AdminSong) => void;
}) {
  return (
    <AdminTable
      ariaLabel="Admin songs table"
      loading={loading}
      rows={rows}
      columns={[
        { key: "title", label: "Title", render: (row) => row.title },
        { key: "artist", label: "Artist", render: (row) => joinArtists(row.artist) },
        { key: "album", label: "Album", render: (row) => row.album?.title ?? "" },
        { key: "track", label: "Track", width: 80, render: (row) => row.trackNo ?? "" },
        {
          key: "hosts",
          label: "HA",
          width: 80,
          render: (row) => `x${row.hostingList?.length ?? 0}`
        },
        {
          key: "actions",
          label: "",
          width: 132,
          render: (row) => (
            <AdminActions
              onEdit={() => onEdit(row)}
              onLyrics={() => onLyrics(row)}
              onDelete={() => onDelete(row)}
            />
          )
        }
      ]}
    />
  );
}

export function VideosSection({
  rows,
  loading,
  onEdit,
  onLyrics,
  onDelete
}: {
  rows: AdminVideo[];
  loading: boolean;
  onEdit: (video: AdminVideo) => void;
  onLyrics: (video: AdminVideo) => void;
  onDelete: (video: AdminVideo) => void;
}) {
  return (
    <AdminTable
      ariaLabel="Admin videos table"
      loading={loading}
      rows={rows}
      columns={[
        { key: "title", label: "Title", render: (row) => row.title },
        { key: "artist", label: "Artist", render: (row) => joinArtists(row.artist) },
        { key: "year", label: "Year", width: 80, render: (row) => row.year ?? "" },
        { key: "format", label: "Format", width: 100, render: (row) => row.format ?? "" },
        {
          key: "hosts",
          label: "HA",
          width: 80,
          render: (row) => `x${row.hostingList?.length ?? 0}`
        },
        {
          key: "actions",
          label: "",
          width: 132,
          render: (row) => (
            <AdminActions
              onEdit={() => onEdit(row)}
              onLyrics={() => onLyrics(row)}
              onDelete={() => onDelete(row)}
            />
          )
        }
      ]}
    />
  );
}

export function AlbumsSection({
  rows,
  loading,
  onEdit,
  onViewMedia,
  onDelete
}: {
  rows: AdminAlbum[];
  loading: boolean;
  onEdit: (album: AdminAlbum) => void;
  onViewMedia: (album: AdminAlbum) => void;
  onDelete: (album: AdminAlbum) => void;
}) {
  return (
    <AdminTable
      ariaLabel="Admin albums table"
      loading={loading}
      rows={rows}
      columns={[
        { key: "title", label: "Title", render: (row) => row.title },
        { key: "artist", label: "Artist", render: (row) => row.artist ?? "" },
        { key: "year", label: "Year", width: 80, render: (row) => row.year ?? "" },
        {
          key: "songs",
          label: "Songs",
          width: 90,
          render: (row) => (
            <Button size="small" onClick={() => onViewMedia(row)}>
              {row.trackList?.length ?? 0}
            </Button>
          )
        },
        {
          key: "actions",
          label: "",
          width: 96,
          render: (row) => (
            <AdminActions onEdit={() => onEdit(row)} onDelete={() => onDelete(row)} />
          )
        }
      ]}
    />
  );
}

export function ArtistsSection({
  rows,
  loading,
  onEdit
}: {
  rows: AdminArtist[];
  loading: boolean;
  onEdit: (artist: AdminArtist) => void;
}) {
  const tableRows = rows.map((artist) => ({ ...artist, id: artist.name }));
  return (
    <AdminTable
      ariaLabel="Admin artists table"
      loading={loading}
      rows={tableRows}
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
          render: (row) => <AdminActions onEdit={() => onEdit(row)} />
        }
      ]}
    />
  );
}

export function HostsSection({
  rows,
  loading,
  onAdd,
  onEdit,
  onDelete
}: {
  rows: AdminHost[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (host: AdminHost) => void;
  onDelete: (host: AdminHost) => void;
}) {
  return (
    <Stack sx={{ height: "100%" }} spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Hosting Provider</Typography>
        <Button variant="contained" onClick={onAdd}>
          Add host
        </Button>
      </Stack>
      <AdminTable
        ariaLabel="Admin hosting providers table"
        loading={loading}
        rows={rows}
        columns={[
          { key: "name", label: "Name", render: (row) => row.name },
          { key: "provider", label: "Provider", render: (row) => row.provider ?? "" },
          { key: "host", label: "Host", render: (row) => row.host ?? "" },
          { key: "path", label: "Path", width: 120, render: (row) => row.path ?? "" },
          {
            key: "actions",
            label: "",
            width: 96,
            render: (row) => (
              <AdminActions onEdit={() => onEdit(row)} onDelete={() => onDelete(row)} />
            )
          }
        ]}
      />
    </Stack>
  );
}
