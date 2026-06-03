import { Album } from "./Album";

export interface Song {
  _id: string;
  type?: "audio" | "video";
  trackNo: number;
  title: string;
  artist: string[];
  size: number;
  duration: number;
  format: string;
  lossless: boolean;
  bitrate: number;
  fileExtension: string;

  bitdepth: string;
  bitsPerSample?: number;
  sampleRate: number;

  album?: Album;
}
