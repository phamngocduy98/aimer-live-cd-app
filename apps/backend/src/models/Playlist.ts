import { model, mongo, Schema, Types } from "mongoose";
export interface IPlaylistItem {
  _id?: Types.ObjectId;
  mediaType: "audio" | "video";
  mediaId: Types.ObjectId;
}

export interface IPlaylist {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  songs: Types.ObjectId[];
  items: IPlaylistItem[];
  createdAt: Date;
  updatedAt: Date;
}

export const playlistSchema = new Schema<IPlaylist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
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

playlistSchema.index({ userId: 1, updatedAt: -1 });

export const Playlist = model("Playlist", playlistSchema, "playlists");
