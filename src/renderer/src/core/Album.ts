import { Song } from "./Song";
import { Video } from "./Video";

export interface Album {
  _id: string;
  cover?: string;
  title: string;
  artist: string;
}

export interface AlbumDetail extends Album {
  genre: string[];
  year: number;
  trackList: Song[];
  videoList: Video[];
}
