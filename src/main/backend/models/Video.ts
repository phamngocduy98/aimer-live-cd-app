import { model, mongo, Schema } from "mongoose";
import { IHosting } from "./Hosting.js";
import { normalizeVideoChapters } from "../utils/videoLibrary.js";

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
  cover?: Buffer;
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
  audioBitsPerSample: number; // bitDepth
  audioCodecRaw: string;

  format: string;
  bitrate: number;

  youtubeUrl?: string;
  hostingList: IHosting[];
  fileExtension: string;
  fileCount: number;

  chapters: IVideoChapter[];

  iv: string;
}

export const videoSchema = new Schema<IVideo>({
  cover: {
    type: "Buffer"
  },
  title: {
    type: "String"
  },
  artist: {
    type: ["String"]
  },
  genre: {
    type: ["String"]
  },
  year: {
    type: "Number"
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

  iv: {
    type: "String"
  }
});

videoSchema.pre("validate", function (next) {
  this.chapters = normalizeVideoChapters(this.title, this.chapters);
  next();
});

export const Video = model("Video", videoSchema, "videos");
