import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import mongoose, { connect, type Connection } from "mongoose";
import { createLogger } from "../utils/log.js";
import {
  inheritVideoAlbumMetadata,
  normalizeVideoChapters
} from "../utils/videoLibrary.js";

const log = createLogger("MigrateVideoLibrary");

export async function migrateVideoLibrary(connection: Connection = mongoose.connection): Promise<{
  chaptersAdded: number;
  videosDetached: number;
  videosEnriched: number;
  albumsUpdated: number;
  emptyAlbumsRemoved: number;
}> {
  const db = connection.db;
  if (!db) throw new Error("MongoDB connection is not ready");

  const videos = db.collection("videos");
  const albums = db.collection("albums");
  const albumRows = await albums
    .find({}, { projection: { title: 1, cover: 1, year: 1, genre: 1 } })
    .toArray();
  const albumsByTitle = new Map<string, (typeof albumRows)[number]>();
  for (const album of albumRows) {
    if (album.title) albumsByTitle.set(album.title.toLowerCase(), album);
  }

  let chaptersAdded = 0;
  let videosDetached = 0;
  let videosEnriched = 0;

  for await (const video of videos.find({})) {
    const matchedAlbum = video.title ? albumsByTitle.get(video.title.toLowerCase()) : undefined;
    const inherited = inheritVideoAlbumMetadata(
      {
        cover: video.cover as Buffer | undefined,
        year: video.year as number | undefined,
        genre: video.genre as string[] | undefined
      },
      matchedAlbum
        ? {
            cover: matchedAlbum.cover as Buffer | undefined,
            year: matchedAlbum.year as number | undefined,
            genre: matchedAlbum.genre as string[] | undefined
          }
        : undefined
    );
    const chapters = normalizeVideoChapters(video.title ?? "Unknown", video.chapters);
    const set: Record<string, unknown> = {};

    if (!video.cover && inherited.cover) set.cover = inherited.cover;
    if (video.year == null && inherited.year != null) set.year = inherited.year;
    if ((!Array.isArray(video.genre) || video.genre.length === 0) && inherited.genre?.length) {
      set.genre = inherited.genre;
    }
    if (!Array.isArray(video.chapters) || video.chapters.length === 0) {
      set.chapters = chapters;
      chaptersAdded++;
    }
    if (Object.keys(set).some((key) => key !== "chapters")) videosEnriched++;
    if (matchedAlbum) videosDetached++;

    console.log(`Processing video ${video._id} - Chapters: ${video.chapters?.length ?? 0} -> ${chapters.length}, Album matched: ${!!matchedAlbum}, Enriched fields: ${Object.keys(set).filter((k) => k !== "chapters").join(", ") || "None"}`);

    if (Object.keys(set).length > 0 || matchedAlbum) {
      await videos.updateOne(
        { _id: video._id },
        {
          ...(Object.keys(set).length > 0 ? { $set: set } : {}),
          ...(matchedAlbum ? { $unset: { album: "" } } : {})
        }
      );
    }
  }

  const albumUpdate = await albums.updateMany(
    { videoList: { $exists: true } },
    { $unset: { videoList: "" } }
  );
  const emptyAlbumDelete = await albums.deleteMany({
    $or: [
      { trackList: { $exists: false } },
      { trackList: null },
      { trackList: { $size: 0 } }
    ]
  });

  return {
    chaptersAdded,
    videosDetached,
    videosEnriched,
    albumsUpdated: albumUpdate.modifiedCount,
    emptyAlbumsRemoved: emptyAlbumDelete.deletedCount
  };
}

async function main() {
  const dbhost = process.env.MONGO_DB_HOST;
  const dbusername = process.env.MONGO_DB_USER;
  const dbpassword = process.env.MONGO_DB_PW;
  if (!dbhost || !dbusername || !dbpassword) {
    throw new Error("Missing MongoDB environment variables");
  }

  mongoose.set("strictQuery", true);
  const uri = `mongodb+srv://${dbusername}:${dbpassword}@${dbhost}/?retryWrites=true&w=majority`;
  await connect(uri, { dbName: process.env.MONGO_DB_NAME || "musicbtxa" });
  log.info(await migrateVideoLibrary(), "Video library migration complete");
  await mongoose.disconnect();
}

if (process.argv[1]?.includes("migrateVideoLibrary")) {
  main().catch(async (error) => {
    log.error({ err: error }, "Video library migration failed");
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
}
