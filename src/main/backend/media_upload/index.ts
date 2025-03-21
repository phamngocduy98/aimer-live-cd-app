import { IAudioMetadata, parseBuffer } from "music-metadata";
import { dbClient } from "../db/Mongo.js";

import { AlbumBuilder, SongBuilder, VideoBuilder } from "../db/builder/index.js";
import { FtpMediaUploader } from "./FtpMediaUploader.js";

function isVideo(meta: IAudioMetadata) {
  return meta.format.trackInfo != null && meta.format.trackInfo.length > 0;
}

export async function uploadSongAPI(
  buffer: Buffer,
  fileExtension: string,
  skipPart?: number,
  limitPart?: number,
  hostId?: string
) {
  const meta = await parseBuffer(buffer);

  let songBuilder = isVideo(meta) ? new VideoBuilder() : new SongBuilder();
  await songBuilder.init(meta, buffer.length, fileExtension);

  const hostings = await dbClient.listHosting();
  const hosting = hostings.find((h) => h.id === hostId) ?? hostings[0];

  songBuilder.addHosting(hosting);

  const albumBuilder = new AlbumBuilder();
  await albumBuilder.init(meta, buffer.length, fileExtension);
  songBuilder.attachAlbum(albumBuilder);

  await albumBuilder.save();
  await songBuilder.save();

  const startTimestamp = Date.now();
  console.log(
    `[ ${"Upload+".padStart(
      15
    )} ] Uploading ${songBuilder._id.toString()} (${songBuilder.title()}) to ${
      hosting.host
    } (Skip ${skipPart} parts, Limit ${limitPart} parts)...`
  );
  const ftpMediaUploader = new FtpMediaUploader();
  await ftpMediaUploader.init(hosting);
  const { fileCount } = await ftpMediaUploader.encryptAndUpload(
    buffer,
    String(songBuilder._id._id),
    fileExtension,
    songBuilder.iv,
    skipPart,
    limitPart
  );
  await ftpMediaUploader.end();

  const uploadDuration = (Date.now() - startTimestamp) / 1000;
  const speed = Math.floor(buffer.length / 1000 / uploadDuration);
  console.log(
    `[ ${"Upload-".padStart(15)} ] Uploaded ${
      buffer.length
    } bytes in ${uploadDuration} seconds (${speed} kB/s)`
  );
  songBuilder.fileCount(fileCount);
  await songBuilder.save();
}
