import { model, mongo, Schema } from "mongoose";
import { IAlbum } from "./Album.js";
import { IHosting } from "./Hosting.js";

export interface ISong {
  trackNo: number;
  title: string;
  artist: string[];
  size: number;
  duration: number;
  format: Format;
  lossless: boolean;
  bitrate: number;

  // bit depth
  bitsPerSample?: number;
  sampleRate?: number;

  fileExtension: string;
  hostingList: IHosting[];
  fileCount: number;
  fileList: string[];

  album: IAlbum;

  iv: string;
}

export type Format = "FLAC" | "MPEG";

export const songSchema = new Schema<ISong>({
  trackNo: {
    type: "Number"
  },
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
  format: {
    type: "String"
  },
  lossless: {
    type: "Boolean"
  },
  bitrate: {
    type: "Number"
  },
  bitsPerSample: {
    type: "Number"
  },
  sampleRate: {
    type: "Number"
  },

  fileList: {
    type: ["String"]
  },
  fileCount: {
    type: "Number"
  },
  fileExtension: {
    type: "String"
  },
  hostingList: {
    type: [mongo.ObjectId],
    ref: "Hosting"
  },

  album: {
    type: mongo.ObjectId,
    ref: "Album"
  },

  iv: {
    type: "String"
  }
});

export const Song = model("Song", songSchema, "songs");
