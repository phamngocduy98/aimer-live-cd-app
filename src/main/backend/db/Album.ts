import { model, mongo, Schema } from "mongoose";
import { IAudioMetadata } from "music-metadata";
import { ISong } from "./Song.js";
import { IVideo } from "./Video.js";

export interface IAlbum {
  cover?: Buffer;
  title: string;
  artist: string;

  genre: string[];
  year?: number;

  trackList: ISong[];
  videoList: IVideo[];
}

function orString(value: string | undefined | null, valueIfNull: string) {
  if (typeof value != "string" || value.length == 0) {
    return valueIfNull;
  }
  return value;
}
function orStringArray(value: string[] | undefined, valueIfEmpty: string[]) {
  if (!Array.isArray(value) || value.length == 0) {
    return valueIfEmpty;
  }
  return value;
}

export function metadataToAlbum(meta: IAudioMetadata): IAlbum {
  if (meta.common.title == null) throw Error("No title!");
  return {
    cover: meta.common.picture?.[0]?.data ? Buffer.from(meta.common.picture?.[0]?.data) : undefined,
    title: orString(meta.common.album, meta.common.title),
    artist: orString(meta.common.albumartist, meta.common.artist ?? "Unknown"),
    year: meta.common.year,
    genre: meta.common.genre ?? [],
    trackList: [],
    videoList: []
  };
}

export const albumSchema = new Schema<IAlbum>({
  cover: {
    type: "Buffer"
  },
  title: {
    type: "String"
  },
  artist: {
    type: "String"
  },

  genre: {
    type: ["String"]
  },
  year: {
    type: "Number"
  },

  trackList: {
    type: [mongo.ObjectId],
    ref: "Song"
  },
  videoList: {
    type: [mongo.ObjectId],
    ref: "Video"
  }
});

export const Album = model("Album", albumSchema, "albums");
