import { model, mongo, Schema } from "mongoose";
import { ISong } from "./Song.js";

export interface IPlaylist {
  name: string;
  description?: string;
  songs: ISong[];
  createdAt: Date;
  updatedAt: Date;
}

export const playlistSchema = new Schema<IPlaylist>(
  {
    name: {
      type: "String",
      required: true
    },
    description: {
      type: "String"
    },
    songs: {
      type: [mongo.ObjectId],
      ref: "Song"
    }
  },
  { timestamps: true }
);

export const Playlist = model("Playlist", playlistSchema, "playlists");
