import { model, mongo, Schema } from "mongoose";
import { IAlbum } from "./Album.js";
import { IHosting } from "./Hosting.js";

export interface IVideoChapter {
  time: number;
  title: string;
  subTitle: string;
}

export const videoChapterSchema = new Schema<IVideoChapter>({
  time: {
    type: "Number"
  },
  title: {
    type: "String"
  },
  subTitle: {
    type: "String"
  }
});

export interface IVideo {
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

  format: string;
  bitrate: number;

  youtubeUrl?: string;
  hostingList: IHosting[];
  fileExtension: string;
  fileCount: number;

  chapters: IVideoChapter[];

  album?: IAlbum;

  iv: string;
}

export const videoSchema = new Schema<IVideo>({
  title: {
    type: "String"
  },
  artist: {
    type: ["String"]
  },
  size: {
    type: "Number"
  },
  duration: {
    type: "Number"
  },

  videoWidth: {
    type: "Number"
  },
  videoHeight: {
    type: "Number"
  },
  videoCodecRaw: {
    type: "String"
  },

  audioLossless: {
    type: "Boolean"
  },
  audioSampleRate: {
    type: "Number"
  },
  audioBitsPerSample: {
    type: "Number"
  },
  audioCodecRaw: {
    type: "String"
  },

  format: {
    type: "String"
  },
  bitrate: {
    type: "Number"
  },

  fileCount: {
    type: "Number"
  },
  fileExtension: {
    type: "String"
  },
  youtubeUrl: {
    type: "String"
  },
  hostingList: {
    type: [mongo.ObjectId],
    ref: "Hosting"
  },

  chapters: {
    type: [videoChapterSchema]
  },

  album: {
    type: mongo.ObjectId,
    ref: "Album"
  },

  iv: {
    type: "String"
  }
});

export const Video = model("Video", videoSchema, "videos");
