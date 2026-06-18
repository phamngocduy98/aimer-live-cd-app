import { model, mongo, Schema, Types } from "mongoose";
export interface IPlaylistItem {
  _id?: Types.ObjectId;
  mediaType: "audio" | "video";
  mediaId: Types.ObjectId;
}

export interface IPlaylist {
  name: string;
  description?: string;
  songs: Types.ObjectId[];
  items: IPlaylistItem[];
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
    },
    items: [
      {
        mediaType: {
          type: String,
          enum: ["audio", "video"],
          required: true
        },
        mediaId: {
          type: mongo.ObjectId,
          required: true
        }
      }
    ]
  },
  { timestamps: true }
);

export const Playlist = model("Playlist", playlistSchema, "playlists");
