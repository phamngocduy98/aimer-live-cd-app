import type { Song, Video } from "@features/library";

export interface PlaylistItemInput {
  mediaType: "audio" | "video";
  mediaId: string;
}

export interface PlaylistItem {
  _id: string;
  mediaType: "audio" | "video";
  media: Song | Video;
}

export interface Playlist {
  _id: string;
  name: string;
  description?: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistDetail {
  _id: string;
  name: string;
  description?: string;
  items: PlaylistItem[];
  createdAt: string;
  updatedAt: string;
}
