export type AdminTab = "uploads" | "songs" | "videos" | "albums" | "artists" | "hosts";

export interface AdminAlbumSummary {
  _id: string;
  title: string;
  artist?: string;
  year?: number;
}

export interface AdminHostSummary {
  _id: string;
  name: string;
  provider?: string;
}

export interface AdminSong {
  _id: string;
  trackNo?: number;
  title: string;
  artist?: string[];
  duration?: number;
  format?: string;
  fileExtension?: string;
  fileCount?: number;
  album?: AdminAlbumSummary;
  hostingList?: AdminHostSummary[];
}

export interface AdminVideo {
  _id: string;
  title: string;
  artist?: string[];
  genre?: string[];
  year?: number;
  hasCover?: boolean;
  duration?: number;
  format?: string;
  videoCodecRaw?: string;
  audioCodecRaw?: string;
  audioSampleRate?: number;
  bitrate?: number;
  fileExtension?: string;
  fileCount?: number;
  hostingList?: AdminHostSummary[];
  chapters?: { time: number; title: string; subTitle?: string }[];
}

export interface YoutubeVideoSubtitle {
  language: string;
  name?: string;
  ext?: string;
  url?: string;
  automatic?: boolean;
}

export interface YoutubeVideoMetadataPreview {
  title: string;
  artists: string[];
  youtubeUrl: string;
  duration: number;
  videoCodecRaw?: string;
  audioCodecRaw?: string;
  audioSampleRate?: number;
  bitrate?: number;
  fileExtension?: string;
  chapters: { time: number; title: string; subTitle?: string }[];
  subtitles: YoutubeVideoSubtitle[];
  cover?: {
    mimeType: string;
    base64: string;
  };
}

export interface AdminAlbum {
  _id: string;
  title: string;
  artist?: string;
  genre?: string[];
  year?: number;
  hasCover?: boolean;
  trackList?: { _id: string; title: string }[];
}

export interface AdminArtist {
  name: string;
  songCount: number;
  videoCount: number;
  albumCount: number;
  hasImage: boolean;
}

export interface AdminHost {
  _id: string;
  name: string;
  provider?: string;
  uploadType?: string;
  streamType?: string;
  host?: string;
  path?: string;
  ftpRoot?: string;
  ftpLimit?: number;
}

export interface AdminUpload {
  id: string;
  name: string;
  type: "song" | "video" | "unknown";
  healthy: boolean;
  health: "healthy" | "missing-parts" | "unknown";
  ha: number;
  fileCount: number;
  missingParts: number[];
  hosts: { id: string; name: string; parts: number[] }[];
}

export interface UploadResult {
  id: string;
  type: "song" | "video";
}
