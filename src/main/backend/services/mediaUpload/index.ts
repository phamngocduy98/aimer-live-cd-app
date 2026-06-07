import { IAudioMetadata, parseBuffer } from "music-metadata";
import { dbClient } from "../../db/Mongo.js";

import { AlbumBuilder, SongBuilder, VideoBuilder } from "../../db/builder/index.js";
import { createLogger } from "../../utils/log.js";
import { UploadConfig, UploadStrategy } from "../../models/Hosting.js";

const log = createLogger("Upload");
import { FtpMediaUploader } from "./FtpMediaUploader.js";
import { MediaUploader } from "./MediaUploader.js";

function isVideo(meta: IAudioMetadata) {
  return meta.format.trackInfo != null && meta.format.trackInfo.length > 0;
}

export function getMediaUploader(uploadConfig: UploadConfig): MediaUploader {
  switch (uploadConfig.type) {
    case UploadStrategy.FTP:
      return new FtpMediaUploader();
    default:
      throw new Error(`Unknown upload strategy: ${(uploadConfig as any).type}`);
  }
}

export async function uploadSongAPI(
  buffer: Buffer,
  fileExtension: string,
  skipPart?: number,
  limitPart?: number,
  hostId?: string,
  onProgress?: (progress: { part: number; total: number; fileName?: string }) => void
): Promise<{ id: string; type: "song" | "video" }> {
  const meta = await parseBuffer(buffer);

  const type = isVideo(meta) ? "video" : "song";
  const songBuilder = type === "video" ? new VideoBuilder() : new SongBuilder();
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
  log.info(
    `Upload+ ${songBuilder._id.toString()} (${songBuilder.title()}) to ${
      hosting.name
    } (Skip ${skipPart} parts, Limit ${limitPart} parts)...`
  );

  const uploader = getMediaUploader(hosting.upload);
  await uploader.init(hosting.upload);
  const { fileCount } = await uploader.encryptAndUpload(
    buffer,
    String(songBuilder._id._id),
    fileExtension,
    songBuilder.iv,
    skipPart,
    limitPart,
    onProgress
  );
  await uploader.end();

  const uploadDuration = (Date.now() - startTimestamp) / 1000;
  const speed = Math.floor(buffer.length / 1000 / uploadDuration);
  log.info(`Upload- Uploaded ${buffer.length} bytes in ${uploadDuration} seconds (${speed} kB/s)`);
  songBuilder.fileCount(fileCount);
  await songBuilder.save();
  return { id: String(songBuilder._id), type };
}
