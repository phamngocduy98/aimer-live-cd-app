import { Song } from "./Song";

export interface Playlist {
  _id: string;
  name: string;
  description?: string;
  songCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistDetail {
  _id: string;
  name: string;
  description?: string;
  songs: Song[];
  createdAt: string;
  updatedAt: string;
}
