import "dotenv/config";
import mongoose from "mongoose";
import { Playlist } from "../models/Playlist.js";
import { createLogger } from "../utils/log.js";

const log = createLogger("MigratePlaylistItems");

export async function migratePlaylistItems(): Promise<number> {
  const playlists = await Playlist.find({
    "songs.0": { $exists: true },
    $or: [{ items: { $exists: false } }, { items: { $size: 0 } }]
  }).exec();

  for (const playlist of playlists) {
    playlist.items = playlist.songs.map((mediaId) => ({
      mediaType: "audio",
      mediaId
    })) as typeof playlist.items;
    await playlist.save();
  }

  return playlists.length;
}

async function main(): Promise<void> {
  const host = process.env.MONGO_DB_HOST;
  if (!host) throw new Error("MONGO_DB_HOST is required");
  await mongoose.connect(host, {
    user: process.env.MONGO_DB_USER,
    pass: process.env.MONGO_DB_PW,
    dbName: process.env.MONGO_DB_NAME
  });
  const migrated = await migratePlaylistItems();
  log.info(`Migrated ${migrated} playlists`);
  await mongoose.disconnect();
}

if (process.argv[1]?.endsWith("migratePlaylistItems.ts")) {
  void main().catch((error) => {
    log.error({ err: error }, "Playlist migration failed");
    process.exitCode = 1;
  });
}
