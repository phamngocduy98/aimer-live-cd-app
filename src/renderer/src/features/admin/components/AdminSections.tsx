import { Avatar, Button, Chip, Stack, Tooltip, Typography } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import { artistImageUrl } from "@utils/artist";
import { formatDuration } from "@utils/formatDuration";
import { mediaArtworkUrl } from "@utils/mediaArtwork";
import type { RadioRequester, RadioState } from "@features/radio";
import type {
  AdminAlbum,
  AdminArtist,
  AdminHost,
  AdminSong,
  AdminUpload,
  AdminUser,
  AdminVideo
} from "../types";
import { joinArtists } from "../utils/adminFormatting";
import { AdminActions, AdminTable } from "./AdminPrimitives";

function formatPartRanges(parts: number[]): string {
  if (parts.length === 0) return "";
  const sorted = [...parts].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start + 1}` : `${start + 1}-${end + 1}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? `${start + 1}` : `${start + 1}-${end + 1}`);
  return ranges.join(", ");
}

function formatRequester(user?: RadioRequester): string {
  if (!user) return "Radio";
  return user.displayName || user.username || "Unknown user";
}

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
            render: (row) => {
              if (row.healthy) return <Chip size="small" label="Healthy" color="success" />;
              if (row.health === "unknown")
                return <Chip size="small" label="Unknown" color="warning" />;
              return (
                <Tooltip title={`Missing: ${formatPartRanges(row.missingParts)}`} arrow>
                  <Chip
                    size="small"
                    label={`${row.fileCount - row.missingParts.length}/${row.fileCount}`}
                    color="warning"
                  />
                </Tooltip>
              );
            }
          },
          {
            key: "ha",
            label: "Hostings",
            width: 140,
            render: (row) => {
              if (row.hosts.length === 0) return "—";
              const [first, ...rest] = row.hosts;
              if (rest.length === 0) return first.name;
              return (
                <Tooltip title={row.hosts.map((h) => h.name).join(", ")} arrow>
                  <span>
                    {first.name}
                    <Chip
                      size="small"
                      label={`+${rest.length}`}
                      sx={{ ml: 0.5, height: 18, fontSize: 11 }}
                    />
                  </span>
                </Tooltip>
              );
            }
          }
        ]}
      />
    </Stack>
  );
}

export function AdminRadioSection({
  state,
  loading,
  controlling,
  deletingId,
  onControl,
  onDeleteQueueItem
}: {
  state?: RadioState;
  loading: boolean;
  controlling: boolean;
  deletingId?: string | null;
  onControl: (action: "pause" | "resume" | "next" | "previous") => void;
  onDeleteQueueItem: (queueItemId: string) => void;
}) {
  const current = state?.current;
  const queue = state?.upcoming ?? [];

  return (
    <Stack sx={{ height: "100%" }} spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Stack>
          <Typography variant="h6">Radio</Typography>
          <Typography color="text.secondary" fontSize={13}>
            {state?.listenerCount ?? 0} active listeners
            {state?.stationStatus.paused ? " · station paused" : ""}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<SkipPreviousIcon />}
            disabled={controlling}
            onClick={() => onControl("previous")}
          >
            Previous
          </Button>
          <Button
            startIcon={state?.stationStatus.paused ? <PlayArrowIcon /> : <PauseIcon />}
            variant="contained"
            disabled={controlling}
            onClick={() => onControl(state?.stationStatus.paused ? "resume" : "pause")}
          >
            {state?.stationStatus.paused ? "Resume" : "Pause"}
          </Button>
          <Button
            endIcon={<SkipNextIcon />}
            disabled={controlling}
            onClick={() => onControl("next")}
          >
            Next
          </Button>
        </Stack>
      </Stack>
      {current && (
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ p: 1.25, borderRadius: 1, bgcolor: "rgba(255,255,255,.05)" }}
        >
          <Avatar
            variant="rounded"
            src={mediaArtworkUrl(current.media)}
            sx={{ width: 58, height: 58 }}
          />
          <Stack sx={{ minWidth: 0 }}>
            <Typography noWrap fontWeight={700}>
              {current.media.title}
            </Typography>
            <Typography noWrap color="text.secondary" fontSize={13}>
              {current.media.artist.join(", ")}
            </Typography>
            <Typography color="text.secondary" fontSize={12}>
              {formatDuration(current.position)} / {formatDuration(current.duration)}
            </Typography>
            {current.requestedByUser && (
              <Typography color="text.secondary" fontSize={12}>
                Requested by {formatRequester(current.requestedByUser)}
              </Typography>
            )}
          </Stack>
        </Stack>
      )}
      <AdminTable
        ariaLabel="Admin radio queue table"
        loading={loading}
        rows={queue.map((item) => ({ ...item, _id: item.queueItemId }))}
        columns={[
          {
            key: "position",
            label: "#",
            width: 60,
            render: (row) => <Chip size="small" label={row.position} />
          },
          { key: "title", label: "Title", render: (row) => row.media.title },
          { key: "artist", label: "Artist", render: (row) => row.media.artist.join(", ") },
          {
            key: "requestedBy",
            label: "Requested by",
            width: 160,
            render: (row) => formatRequester(row.requestedByUser)
          },
          { key: "type", label: "Type", width: 90, render: (row) => row.mediaType },
          {
            key: "actions",
            label: "",
            width: 84,
            render: (row) => (
              <AdminActions
                onDelete={
                  deletingId === row.queueItemId
                    ? undefined
                    : () => onDeleteQueueItem(row.queueItemId)
                }
              />
            )
          }
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
          render: (row) => (
            <Chip
              size="small"
              label={(row.hostingList?.length ?? 0) > 0 ? "A" : "U"}
              color={(row.hostingList?.length ?? 0) > 0 ? "success" : "error"}
              sx={{ minWidth: 36, fontWeight: 700 }}
            />
          )
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
  onAddYoutube,
  onEdit,
  onLyrics,
  onDelete
}: {
  rows: AdminVideo[];
  loading: boolean;
  onAddYoutube: () => void;
  onEdit: (video: AdminVideo) => void;
  onLyrics: (video: AdminVideo) => void;
  onDelete: (video: AdminVideo) => void;
}) {
  return (
    <Stack sx={{ height: "100%" }} spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Videos</Typography>
        <Button startIcon={<AddCircleOutlineIcon />} variant="contained" onClick={onAddYoutube}>
          Add YouTube video
        </Button>
      </Stack>
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
            render: (row) => (
              <Chip
                size="small"
                label={(row.hostingList?.length ?? 0) > 0 ? "A" : "U"}
                color={(row.hostingList?.length ?? 0) > 0 ? "success" : "error"}
                sx={{ minWidth: 36, fontWeight: 700 }}
              />
            )
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
    </Stack>
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

export function UsersSection({
  rows,
  loading,
  onAdd,
  onEdit
}: {
  rows: AdminUser[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (user: AdminUser) => void;
}) {
  return (
    <Stack sx={{ height: "100%" }} spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Users</Typography>
        <Button variant="contained" onClick={onAdd}>
          Add user
        </Button>
      </Stack>
      <AdminTable
        ariaLabel="Admin users table"
        loading={loading}
        rows={rows}
        columns={[
          { key: "username", label: "Username", render: (row) => row.username },
          { key: "displayName", label: "Display name", render: (row) => row.displayName },
          { key: "role", label: "Role", width: 100, render: (row) => row.role },
          {
            key: "subscription",
            label: "Subscription",
            render: (row) => `${row.subscription.plan} / ${row.subscription.status}`
          },
          {
            key: "enabled",
            label: "Enabled",
            width: 90,
            render: (row) => (row.enabled ? "Yes" : "No")
          },
          {
            key: "actions",
            label: "",
            width: 64,
            render: (row) => <AdminActions onEdit={() => onEdit(row)} />
          }
        ]}
      />
    </Stack>
  );
}
