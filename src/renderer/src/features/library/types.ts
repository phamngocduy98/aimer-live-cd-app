export interface Album {
  _id: string;
  cover?: string;
  title: string;
  artist: string;
  year?: number;
}

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
  genre?: string[];
  year?: number;
  size: number;
  duration: number;
  videoWidth: number;
  videoHeight: number;
  videoCodecRaw: string;
  audioLossless: boolean;
  audioSampleRate: number;
  audioBitsPerSample: number;
  audioCodecRaw: string;
  youtubeUrl?: string;
  fileExtension: string;
  format: string;
  bitrate: number;
  chapters: IVideoChapter[];
}

export function isVideo(value: Video | Song | null): value is Video {
  return Boolean(
    value &&
      (value.type === "video" ||
        "videoWidth" in value ||
        "videoHeight" in value ||
        "videoCodecRaw" in value ||
        "youtubeUrl" in value)
  );
}
