import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import mongoose, { connect } from "mongoose";
import { Album } from "../models/Album.js";
import { Song } from "../models/Song.js";
import { createLogger } from "../utils/log.js";

const log = createLogger("CleanupAlbumRefs");

async function cleanupAlbumRefs() {
  const dbhost = process.env.MONGO_DB_HOST;
  const dbusername = process.env.MONGO_DB_USER;
  const dbpassword = process.env.MONGO_DB_PW;

  if (!dbhost || !dbusername || !dbpassword) {
    log.error("Missing MongoDB environment variables");
    process.exit(1);
  }

  mongoose.set("strictQuery", true);
  const uri = `mongodb+srv://${dbusername}:${dbpassword}@${dbhost}/?retryWrites=true&w=majority`;
  await connect(uri, { dbName: process.env.MONGO_DB_NAME || "musicbtxa" });

  const albums = await Album.find({ "trackList.0": { $exists: true } }).lean();

  let totalCleaned = 0;
  let totalRemoved = 0;

  for (const album of albums) {
    const trackIds = album.trackList ?? [];
    let changed = false;

    if (trackIds.length > 0) {
      const existingTracks = await Song.find({ _id: { $in: trackIds } }, { _id: 1 }).lean();
      const validTrackIds = existingTracks.map((s) => s._id);
      if (validTrackIds.length !== trackIds.length) {
        const removed = trackIds.length - validTrackIds.length;
        await Album.updateOne({ _id: album._id }, { $set: { trackList: validTrackIds } });
        log.info(`Album "${album.title}": removed ${removed} stale song ref(s)`);
        totalRemoved += removed;
        changed = true;
      }
    }

    if (changed) totalCleaned++;
  }

  log.info(`\nDone. Cleaned ${totalCleaned} albums, removed ${totalRemoved} stale references.`);
  process.exit(0);
}

cleanupAlbumRefs().catch((err) => {
  log.error({ err }, "Cleanup failed");
  process.exit(1);
});
