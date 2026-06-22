import React from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  useAdminAlbums,
  useAdminArtists,
  useAdminHosts,
  useAdminSongs,
  useAdminUploads,
  useAdminUsers,
  useAdminVideos,
  useControlAdminRadio,
  useDeleteAdminAlbum,
  useDeleteAdminHost,
  useDeleteAdminRadioQueueItem,
  useDeleteAdminSong,
  useDeleteAdminVideo,
  useSaveAdminUser
} from "../hooks/useAdmin";
import { useRadioState } from "@features/radio";
import type {
  AdminAlbum,
  AdminArtist,
  AdminHost,
  AdminSong,
  AdminTab,
  AdminUser,
  AdminUserPayload,
  AdminVideo
} from "../types";
import {
  AlbumEditDialog,
  AlbumMediaDialog,
  ArtistEditDialog,
  HostEditDialog,
  SongEditDialog,
  UploadMediaDialog,
  VideoEditDialog,
  YoutubeVideoCreateDialog
} from "./AdminEditDialogs";
import { AdminNavigation, ConfirmDialog } from "./AdminPrimitives";
import {
  AlbumsSection,
  AdminRadioSection,
  ArtistsSection,
  HostsSection,
  SongsSection,
  UploadsSection,
  UsersSection,
  VideosSection
} from "./AdminSections";
import { SynchronizedLyricsDialog } from "./SynchronizedLyricsDialog";

interface AdminDialogProps {
  open: boolean;
  onClose: () => void;
}

type DeleteTarget =
  | { type: "song"; item: AdminSong }
  | { type: "video"; item: AdminVideo }
  | { type: "album"; item: AdminAlbum }
  | { type: "host"; item: AdminHost };

export function AdminDialog({ open, onClose }: AdminDialogProps) {
  const [tab, setTab] = React.useState<AdminTab>("radio");
  const [visitedTabs, setVisitedTabs] = React.useState<ReadonlySet<AdminTab>>(
    () => new Set(["radio"])
  );
  const deleteSong = useDeleteAdminSong();
  const deleteVideo = useDeleteAdminVideo();
  const deleteAlbum = useDeleteAdminAlbum();
  const deleteHost = useDeleteAdminHost();
  const controlRadio = useControlAdminRadio();
  const deleteRadioQueueItem = useDeleteAdminRadioQueueItem();
  const [songEdit, setSongEdit] = React.useState<AdminSong | null>(null);
  const [videoEdit, setVideoEdit] = React.useState<AdminVideo | null>(null);
  const [lyricsTarget, setLyricsTarget] = React.useState<
    { mediaType: "audio"; media: AdminSong } | { mediaType: "video"; media: AdminVideo } | null
  >(null);
  const [albumEdit, setAlbumEdit] = React.useState<AdminAlbum | null>(null);
  const [albumMedia, setAlbumMedia] = React.useState<AdminAlbum | null>(null);
  const [artistEdit, setArtistEdit] = React.useState<AdminArtist | null>(null);
  const [hostEdit, setHostEdit] = React.useState<AdminHost | null | undefined>(undefined);
  const [userEdit, setUserEdit] = React.useState<AdminUser | null | undefined>(undefined);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [youtubeOpen, setYoutubeOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget | null>(null);
  const [deletingRadioQueueId, setDeletingRadioQueueId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setVisitedTabs((current) => {
      if (current.has(tab)) return current;
      return new Set([...current, tab]);
    });
  }, [open, tab]);

  const uploads = useAdminUploads(open && visitedTabs.has("uploads"));
  const songs = useAdminSongs(open && visitedTabs.has("songs"));
  const videos = useAdminVideos(open && visitedTabs.has("videos"));
  const albums = useAdminAlbums(open && (visitedTabs.has("albums") || Boolean(songEdit)));
  const artists = useAdminArtists(open && visitedTabs.has("artists"));
  const hosts = useAdminHosts(open && (visitedTabs.has("hosts") || uploadOpen));
  const users = useAdminUsers(open && visitedTabs.has("users"));
  const radio = useRadioState({ subscribe: open && visitedTabs.has("radio") });

  const albumRows = albums.data ?? [];
  const hostRows = hosts.data ?? [];

  const renderContent = (): React.ReactNode => {
    switch (tab) {
      case "radio":
        return (
          <AdminRadioSection
            state={radio.data}
            loading={radio.isLoading}
            controlling={controlRadio.isPending}
            deletingId={deletingRadioQueueId}
            onControl={(action) => controlRadio.mutate(action)}
            onDeleteQueueItem={(queueItemId) => {
              setDeletingRadioQueueId(queueItemId);
              deleteRadioQueueItem.mutate(queueItemId, {
                onSettled: () => setDeletingRadioQueueId(null)
              });
            }}
          />
        );
      case "uploads":
        return (
          <UploadsSection
            rows={uploads.data ?? []}
            loading={uploads.isLoading}
            onUpload={() => setUploadOpen(true)}
          />
        );
      case "songs":
        return (
          <SongsSection
            rows={songs.data ?? []}
            loading={songs.isLoading}
            onEdit={setSongEdit}
            onLyrics={(media) => setLyricsTarget({ mediaType: "audio", media })}
            onDelete={(item) => setDeleteTarget({ type: "song", item })}
          />
        );
      case "videos":
        return (
          <VideosSection
            rows={videos.data ?? []}
            loading={videos.isLoading}
            onAddYoutube={() => setYoutubeOpen(true)}
            onEdit={setVideoEdit}
            onLyrics={(media) => setLyricsTarget({ mediaType: "video", media })}
            onDelete={(item) => setDeleteTarget({ type: "video", item })}
          />
        );
      case "albums":
        return (
          <AlbumsSection
            rows={albumRows}
            loading={albums.isLoading}
            onEdit={setAlbumEdit}
            onViewMedia={setAlbumMedia}
            onDelete={(item) => setDeleteTarget({ type: "album", item })}
          />
        );
      case "artists":
        return (
          <ArtistsSection
            rows={artists.data ?? []}
            loading={artists.isLoading}
            onEdit={setArtistEdit}
          />
        );
      case "hosts":
        return (
          <HostsSection
            rows={hostRows}
            loading={hosts.isLoading}
            onAdd={() => setHostEdit(null)}
            onEdit={setHostEdit}
            onDelete={(item) => setDeleteTarget({ type: "host", item })}
          />
        );
      case "users":
        return (
          <UsersSection
            rows={users.data ?? []}
            loading={users.isLoading}
            onAdd={() => setUserEdit(null)}
            onEdit={setUserEdit}
          />
        );
      default:
        return null;
    }
  };

  const deleteMessage =
    deleteTarget?.type === "song" || deleteTarget?.type === "video"
      ? "Remote media files will be deleted first. Metadata will remain if remote cleanup fails."
      : "This deletes the selected admin record and updates references where needed.";

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} aria-labelledby="admin-dialog-title">
      <Box
        sx={{
          width: 1120,
          height: 720,
          bgcolor: "#080808",
          color: "#fff",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <DialogTitle id="admin-dialog-title" sx={{ display: "flex", alignItems: "center", pr: 1 }}>
          <Typography component="span" variant="h6" sx={{ flex: 1 }}>
            Admin
          </Typography>
          <IconButton aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <Box sx={{ display: "flex", minHeight: 0, flex: 1 }}>
          <AdminNavigation value={tab} onChange={setTab} />
          <DialogContent sx={{ p: 2, minWidth: 0, flex: 1, height: "100%" }}>
            {renderContent()}
          </DialogContent>
        </Box>
      </Box>
      <SongEditDialog
        song={songEdit}
        albums={albumRows}
        open={Boolean(songEdit)}
        onClose={() => setSongEdit(null)}
      />
      <VideoEditDialog
        video={videoEdit}
        open={Boolean(videoEdit)}
        onClose={() => setVideoEdit(null)}
      />
      <SynchronizedLyricsDialog
        media={lyricsTarget?.media ?? null}
        mediaType={lyricsTarget?.mediaType ?? "audio"}
        open={Boolean(lyricsTarget)}
        onClose={() => setLyricsTarget(null)}
      />
      <AlbumEditDialog
        album={albumEdit}
        open={Boolean(albumEdit)}
        onClose={() => setAlbumEdit(null)}
      />
      <AlbumMediaDialog
        album={albumMedia}
        open={Boolean(albumMedia)}
        onClose={() => setAlbumMedia(null)}
      />
      <ArtistEditDialog
        artist={artistEdit}
        open={Boolean(artistEdit)}
        onClose={() => setArtistEdit(null)}
      />
      <HostEditDialog
        host={hostEdit ?? null}
        open={hostEdit !== undefined}
        onClose={() => setHostEdit(undefined)}
      />
      <UserEditDialog
        user={userEdit ?? null}
        open={userEdit !== undefined}
        onClose={() => setUserEdit(undefined)}
      />
      <UploadMediaDialog
        open={uploadOpen}
        hosts={hostRows}
        onClose={() => setUploadOpen(false)}
        onUploaded={(media, type) => {
          if (type === "song") setSongEdit(media as AdminSong);
          else setVideoEdit(media as AdminVideo);
        }}
      />
      <YoutubeVideoCreateDialog open={youtubeOpen} onClose={() => setYoutubeOpen(false)} />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Confirm delete"
        message={deleteMessage}
        pending={
          deleteSong.isPending ||
          deleteVideo.isPending ||
          deleteAlbum.isPending ||
          deleteHost.isPending
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          const onSuccess = () => setDeleteTarget(null);
          if (deleteTarget.type === "song") deleteSong.mutate(deleteTarget.item._id, { onSuccess });
          if (deleteTarget.type === "video")
            deleteVideo.mutate(deleteTarget.item._id, { onSuccess });
          if (deleteTarget.type === "album")
            deleteAlbum.mutate(deleteTarget.item._id, { onSuccess });
          if (deleteTarget.type === "host") deleteHost.mutate(deleteTarget.item._id, { onSuccess });
        }}
      />
    </Dialog>
  );
}

function UserEditDialog({
  user,
  open,
  onClose
}: {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
}) {
  const save = useSaveAdminUser();
  const [draft, setDraft] = React.useState<AdminUserPayload>({
    username: "",
    displayName: "",
    password: "",
    role: "member",
    enabled: true,
    subscription: { plan: "free", status: "none", currentPeriodEnd: "" }
  });

  React.useEffect(() => {
    setDraft({
      username: user?.username ?? "",
      displayName: user?.displayName ?? "",
      password: "",
      role: user?.role ?? "member",
      enabled: user?.enabled ?? true,
      subscription: {
        plan: user?.subscription.plan ?? "free",
        status: user?.subscription.status ?? "none",
        currentPeriodEnd: user?.subscription.currentPeriodEnd?.slice(0, 10) ?? ""
      }
    });
  }, [user, open]);

  const submit = () => {
    const payload: AdminUserPayload = {
      ...draft,
      displayName: draft.displayName || draft.username,
      subscription: {
        ...draft.subscription,
        currentPeriodEnd: draft.subscription.currentPeriodEnd || undefined
      }
    };
    if (user && !payload.password) delete payload.password;
    save.mutate(
      { id: user?._id, data: payload },
      {
        onSuccess: onClose
      }
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{user ? "Edit user" : "Create user"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Username"
            value={draft.username}
            disabled={Boolean(user)}
            onChange={(event) => setDraft({ ...draft, username: event.target.value })}
          />
          <TextField
            label="Display name"
            value={draft.displayName}
            onChange={(event) => setDraft({ ...draft, displayName: event.target.value })}
          />
          <TextField
            label={user ? "New password" : "Password"}
            type="password"
            value={draft.password}
            helperText={user ? "Leave blank to keep the current password." : undefined}
            onChange={(event) => setDraft({ ...draft, password: event.target.value })}
          />
          <TextField
            select
            label="Role"
            value={draft.role}
            onChange={(event) =>
              setDraft({ ...draft, role: event.target.value as "admin" | "member" })
            }
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="member">Member</MenuItem>
          </TextField>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Plan"
              value={draft.subscription.plan}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  subscription: { ...draft.subscription, plan: event.target.value }
                })
              }
              fullWidth
            />
            <TextField
              select
              label="Status"
              value={draft.subscription.status}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  subscription: {
                    ...draft.subscription,
                    status: event.target.value as AdminUserPayload["subscription"]["status"]
                  }
                })
              }
              fullWidth
            >
              {["none", "trialing", "active", "past_due", "canceled"].map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <TextField
            label="Current period end"
            type="date"
            value={draft.subscription.currentPeriodEnd ?? ""}
            InputLabelProps={{ shrink: true }}
            onChange={(event) =>
              setDraft({
                ...draft,
                subscription: { ...draft.subscription, currentPeriodEnd: event.target.value }
              })
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={draft.enabled}
                onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })}
              />
            }
            label="Enabled"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={submit}
          disabled={!draft.username || (!user && !draft.password) || save.isPending}
        >
          Save user
        </Button>
      </DialogActions>
    </Dialog>
  );
}
