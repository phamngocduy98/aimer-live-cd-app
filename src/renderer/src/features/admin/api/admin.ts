import { apiAssetUrl, apiClient } from "@lib/axios";
import type { LyricsRow } from "@features/lyrics";
import type {
  AdminAlbum,
  AdminArtist,
  AdminHost,
  AdminSong,
  AdminUpload,
  AdminUser,
  AdminUserPayload,
  AdminVideo,
  AdminRadioAction,
  AdminRadioState,
  UploadResult,
  YoutubeVideoMetadataPreview
} from "../types";

export const listAdminUploads = async (): Promise<AdminUpload[]> =>
  (await apiClient.get<AdminUpload[]>("/admin/uploads")).data;

export const listAdminSongs = async (): Promise<AdminSong[]> =>
  (await apiClient.get<AdminSong[]>("/admin/songs")).data;

export const listAdminVideos = async (): Promise<AdminVideo[]> =>
  (await apiClient.get<AdminVideo[]>("/admin/videos")).data;

export const listAdminAlbums = async (): Promise<AdminAlbum[]> =>
  (await apiClient.get<AdminAlbum[]>("/admin/albums")).data;

export const listAdminArtists = async (): Promise<AdminArtist[]> =>
  (await apiClient.get<AdminArtist[]>("/admin/artists")).data;

export const listAdminHosts = async (): Promise<AdminHost[]> =>
  (await apiClient.get<AdminHost[]>("/admin/hosts")).data;

export const listAdminUsers = async (): Promise<AdminUser[]> =>
  (await apiClient.get<AdminUser[]>("/admin/users")).data;

export const controlAdminRadio = async (action: AdminRadioAction): Promise<AdminRadioState> =>
  (await apiClient.post<AdminRadioState>("/admin/radio/control", { action })).data;

export const deleteAdminRadioQueueItem = async (queueItemId: string): Promise<void> => {
  await apiClient.delete(`/admin/radio/queue/${queueItemId}`);
};

export const createAdminUser = async (data: AdminUserPayload): Promise<AdminUser> =>
  (await apiClient.post<AdminUser>("/admin/users", data)).data;

export const updateAdminUser = async (
  id: string,
  data: Partial<AdminUserPayload>
): Promise<AdminUser> => (await apiClient.put<AdminUser>(`/admin/users/${id}`, data)).data;

export const updateAdminSong = async (id: string, data: Partial<AdminSong>): Promise<void> => {
  await apiClient.put(`/admin/songs/${id}`, data);
};

export const updateAdminVideo = async (id: string, data: Partial<AdminVideo>): Promise<void> => {
  await apiClient.put(`/admin/videos/${id}`, data);
};

export const updateAdminVideoCover = async (id: string, file: File): Promise<void> => {
  const form = new FormData();
  form.append("cover", file);
  await apiClient.put(`/admin/videos/${id}/cover`, form);
};

export const loadYoutubeVideoMetadata = async (
  youtubeUrl: string
): Promise<YoutubeVideoMetadataPreview> =>
  (await apiClient.post<YoutubeVideoMetadataPreview>("/videos/youtube/metadata", { youtubeUrl }))
    .data;

export const createYoutubeVideo = async (
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
  },
  cover?: File
): Promise<UploadResult> => {
  const form = new FormData();
  form.append("metadata", JSON.stringify(metadata));
  if (cover) form.append("cover", cover);
  return (await apiClient.post<UploadResult>("/videos/youtube", form)).data;
};

export const previewYoutubeLyrics = async (
  subtitles: YoutubeVideoMetadataPreview["subtitles"]
): Promise<{ rows: LyricsRow[] }> =>
  (await apiClient.post<{ rows: LyricsRow[] }>("/videos/youtube/lyrics-preview", { subtitles }))
    .data;

export const updateAdminAlbum = async (id: string, data: Partial<AdminAlbum>): Promise<void> => {
  await apiClient.put(`/admin/albums/${id}`, data);
};

export const updateAdminAlbumCover = async (id: string, file: File): Promise<void> => {
  const form = new FormData();
  form.append("cover", file);
  await apiClient.put(`/admin/albums/${id}/cover`, form);
};

export const updateAdminHost = async (id: string, data: Partial<AdminHost>): Promise<void> => {
  await apiClient.put(`/admin/hosts/${id}`, data);
};

export const createAdminHost = async (data: Partial<AdminHost> & { ftpCredential?: unknown }) => {
  await apiClient.post("/admin/hosts", data);
};

export const deleteAdminSong = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/songs/${id}`);
};

export const deleteAdminVideo = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/videos/${id}`);
};

export const deleteAdminAlbum = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/albums/${id}`);
};

export const deleteAdminHost = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/hosts/${id}`);
};

export const renameAdminArtist = async (from: string, name: string): Promise<void> => {
  await apiClient.put(`/admin/artists/${encodeURIComponent(from)}`, { name });
};

export const updateAdminArtistImage = async (name: string, file: File): Promise<void> => {
  const form = new FormData();
  form.append("image", file);
  await apiClient.put(`/admin/artists/${encodeURIComponent(name)}/image`, form);
};

export const uploadAdminMedia = async (
  hostId: string,
  file: File,
  progressId?: string
): Promise<UploadResult> => {
  const form = new FormData();
  form.append("audio", file);
  return (
    await apiClient.post<UploadResult>(`/upload/${hostId}`, form, {
      params: progressId ? { progressId } : undefined
    })
  ).data;
};

export const uploadProgressUrl = (progressId: string): string =>
  apiAssetUrl(`/upload-progress/${encodeURIComponent(progressId)}`);
