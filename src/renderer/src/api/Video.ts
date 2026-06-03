import { Album } from "./Album";
import { Song } from "./Song";

export interface IVideoChapter {
  time: number;
  title: string;
  subTitle: string;
}

export interface Video {
  _id: string;
  type?: "audio" | "video";
  title: string;
  artist: string[];
  size: number;
  duration: number;

  videoWidth: number;
  videoHeight: number;
  videoCodecRaw: string;

  audioLossless: boolean;
  audioSampleRate: number;
  audioBitsPerSample: number; // bitDepth
  audioCodecRaw: string;

  youtubeUrl?: string;
  fileExtension: string;
  format: string;
  bitrate: number;

  album?: Album;
  chapters: IVideoChapter[];
}

export function isVideo(v: Video | Song | null): v is Video {
  return v?.type === "video";
}
