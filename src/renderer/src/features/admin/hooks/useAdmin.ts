import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@lib/queryClient";
import {
  createYoutubeVideo,
  createAdminUser,
  createAdminHost,
  deleteAdminAlbum,
  deleteAdminHost,
  deleteAdminSong,
  deleteAdminVideo,
  listAdminAlbums,
  listAdminArtists,
  listAdminHosts,
  listAdminSongs,
  listAdminUploads,
  listAdminUsers,
  listAdminVideos,
  loadYoutubeVideoMetadata,
  previewYoutubeLyrics,
  renameAdminArtist,
  updateAdminAlbum,
  updateAdminAlbumCover,
  updateAdminArtistImage,
  updateAdminHost,
  updateAdminSong,
  updateAdminUser,
  updateAdminVideo,
  updateAdminVideoCover,
  uploadAdminMedia
} from "../api/admin";
import type { AdminAlbum, AdminHost, AdminSong, AdminUserPayload, AdminVideo } from "../types";
import type { YoutubeVideoMetadataPreview } from "../types";

export const adminKeys = {
  all: ["admin"] as const,
  uploads: ["admin", "uploads"] as const,
  songs: ["admin", "songs"] as const,
  videos: ["admin", "videos"] as const,
  albums: ["admin", "albums"] as const,
  artists: ["admin", "artists"] as const,
  hosts: ["admin", "hosts"] as const,
  users: ["admin", "users"] as const
};

const invalidateAdmin = async () => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: adminKeys.all }),
    queryClient.invalidateQueries({ queryKey: ["library"] }),
    queryClient.invalidateQueries({ queryKey: ["video"] }),
    queryClient.invalidateQueries({ queryKey: ["artist"] }),
    queryClient.invalidateQueries({ queryKey: ["search"] })
  ]);
};

export const useAdminUploads = () =>
  useQuery({ queryKey: adminKeys.uploads, queryFn: listAdminUploads });
export const useAdminSongs = () => useQuery({ queryKey: adminKeys.songs, queryFn: listAdminSongs });
export const useAdminVideos = () =>
  useQuery({ queryKey: adminKeys.videos, queryFn: listAdminVideos });
export const useAdminAlbums = () =>
  useQuery({ queryKey: adminKeys.albums, queryFn: listAdminAlbums });
export const useAdminArtists = () =>
  useQuery({ queryKey: adminKeys.artists, queryFn: listAdminArtists });
export const useAdminHosts = () => useQuery({ queryKey: adminKeys.hosts, queryFn: listAdminHosts });
export const useAdminUsers = () => useQuery({ queryKey: adminKeys.users, queryFn: listAdminUsers });

export const useUpdateAdminSong = () =>
  useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminSong> }) =>
      updateAdminSong(id, data),
    onSuccess: invalidateAdmin
  });

export const useUpdateAdminVideo = () =>
  useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminVideo> }) =>
      updateAdminVideo(id, data),
    onSuccess: invalidateAdmin
  });

export const useUpdateAdminVideoCover = () =>
  useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => updateAdminVideoCover(id, file),
    onSuccess: invalidateAdmin
  });

export const useLoadYoutubeVideoMetadata = () =>
  useMutation({
    mutationFn: ({ youtubeUrl }: { youtubeUrl: string }) => loadYoutubeVideoMetadata(youtubeUrl)
  });

export const useCreateYoutubeVideo = () =>
  useMutation({
    mutationFn: ({
      metadata,
      cover
    }: {
      metadata: {
        title: string;
        artists: string[];
        genres?: string[];
        year?: number;
        youtubeUrl: string;
        duration: number;
        videoCodecRaw?: string;
        audioCodecRaw?: string;
        audioSampleRate?: number;
        bitrate?: number;
        fileExtension?: string;
        chapters?: { time: number; title: string; subTitle?: string }[];
        subtitles?: {
          language: string;
          name?: string;
          ext?: string;
          url?: string;
          automatic?: boolean;
        }[];
      };
      cover?: File;
    }) => createYoutubeVideo(metadata, cover),
    onSuccess: invalidateAdmin
  });

export const usePreviewYoutubeLyrics = () =>
  useMutation({
    mutationFn: ({ subtitles }: { subtitles: YoutubeVideoMetadataPreview["subtitles"] }) =>
      previewYoutubeLyrics(subtitles)
  });

export const useUpdateAdminAlbum = () =>
  useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminAlbum> }) =>
      updateAdminAlbum(id, data),
    onSuccess: invalidateAdmin
  });

export const useUpdateAdminAlbumCover = () =>
  useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => updateAdminAlbumCover(id, file),
    onSuccess: invalidateAdmin
  });

export const useSaveAdminHost = () =>
  useMutation({
    mutationFn: ({
      id,
      data
    }: {
      id?: string;
      data: Partial<AdminHost> & { ftpCredential?: unknown };
    }) => (id ? updateAdminHost(id, data) : createAdminHost(data)),
    onSuccess: invalidateAdmin
  });

export const useDeleteAdminSong = () =>
  useMutation({ mutationFn: deleteAdminSong, onSuccess: invalidateAdmin });
export const useDeleteAdminVideo = () =>
  useMutation({ mutationFn: deleteAdminVideo, onSuccess: invalidateAdmin });
export const useDeleteAdminAlbum = () =>
  useMutation({ mutationFn: deleteAdminAlbum, onSuccess: invalidateAdmin });
export const useDeleteAdminHost = () =>
  useMutation({ mutationFn: deleteAdminHost, onSuccess: invalidateAdmin });

export const useRenameAdminArtist = () =>
  useMutation({
    mutationFn: ({ from, name }: { from: string; name: string }) => renameAdminArtist(from, name),
    onSuccess: invalidateAdmin
  });

export const useUpdateAdminArtistImage = () =>
  useMutation({
    mutationFn: ({ name, file }: { name: string; file: File }) =>
      updateAdminArtistImage(name, file),
    onSuccess: invalidateAdmin
  });

export const useUploadAdminMedia = () =>
  useMutation({
    mutationFn: ({
      hostId,
      file,
      progressId
    }: {
      hostId: string;
      file: File;
      progressId?: string;
    }) => uploadAdminMedia(hostId, file, progressId),
    onSuccess: invalidateAdmin
  });

export const useSaveAdminUser = () =>
  useMutation({
    mutationFn: ({ id, data }: { id?: string; data: AdminUserPayload | Partial<AdminUserPayload> }) =>
      id ? updateAdminUser(id, data) : createAdminUser(data as AdminUserPayload),
    onSuccess: invalidateAdmin
  });
