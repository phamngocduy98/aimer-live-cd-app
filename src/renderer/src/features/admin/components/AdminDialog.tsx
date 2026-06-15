import React from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
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
  useDeleteAdminVideo
} from "../hooks/useAdmin";
import type { AdminAlbum, AdminArtist, AdminHost, AdminSong, AdminTab, AdminVideo } from "../types";
import {
  AlbumEditDialog,
  AlbumMediaDialog,
  ArtistEditDialog,
  HostEditDialog,
  SongEditDialog,
  UploadMediaDialog,
  VideoEditDialog
} from "./AdminEditDialogs";
import { AdminNavigation, ConfirmDialog } from "./AdminPrimitives";
import {
  AlbumsSection,
  ArtistsSection,
  HostsSection,
  SongsSection,
  UploadsSection,
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
  const [tab, setTab] = React.useState<AdminTab>("songs");
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
  const [lyricsTarget, setLyricsTarget] = React.useState<
    { mediaType: "audio"; media: AdminSong } | { mediaType: "video"; media: AdminVideo } | null
  >(null);
  const [albumEdit, setAlbumEdit] = React.useState<AdminAlbum | null>(null);
  const [albumMedia, setAlbumMedia] = React.useState<AdminAlbum | null>(null);
  const [artistEdit, setArtistEdit] = React.useState<AdminArtist | null>(null);
  const [hostEdit, setHostEdit] = React.useState<AdminHost | null | undefined>(undefined);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget | null>(null);

  const albumRows = albums.data ?? [];
  const hostRows = hosts.data ?? [];

  const content: Record<AdminTab, React.ReactNode> = {
    uploads: (
      <UploadsSection
        rows={uploads.data ?? []}
        loading={uploads.isLoading}
        onUpload={() => setUploadOpen(true)}
      />
    ),
    songs: (
      <SongsSection
        rows={songs.data ?? []}
        loading={songs.isLoading}
        onEdit={setSongEdit}
        onLyrics={(media) => setLyricsTarget({ mediaType: "audio", media })}
        onDelete={(item) => setDeleteTarget({ type: "song", item })}
      />
    ),
    videos: (
      <VideosSection
        rows={videos.data ?? []}
        loading={videos.isLoading}
        onEdit={setVideoEdit}
        onLyrics={(media) => setLyricsTarget({ mediaType: "video", media })}
        onDelete={(item) => setDeleteTarget({ type: "video", item })}
      />
    ),
    albums: (
      <AlbumsSection
        rows={albumRows}
        loading={albums.isLoading}
        onEdit={setAlbumEdit}
        onViewMedia={setAlbumMedia}
        onDelete={(item) => setDeleteTarget({ type: "album", item })}
      />
    ),
    artists: (
      <ArtistsSection
        rows={artists.data ?? []}
        loading={artists.isLoading}
        onEdit={setArtistEdit}
      />
    ),
    hosts: (
      <HostsSection
        rows={hostRows}
        loading={hosts.isLoading}
        onAdd={() => setHostEdit(null)}
        onEdit={setHostEdit}
        onDelete={(item) => setDeleteTarget({ type: "host", item })}
      />
    )
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
            {content[tab]}
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
