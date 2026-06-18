import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Types } from "mongoose";
import { PARTSIZE } from "../config/const.js";
import { Album } from "../models/Album.js";
import { ArtistProfile } from "../models/ArtistProfile.js";
import { Hosting, IHosting, StreamStrategy, UploadStrategy } from "../models/Hosting.js";
import { Playlist } from "../models/Playlist.js";
import { Song } from "../models/Song.js";
import { Video } from "../models/Video.js";
import { Lyrics } from "../models/Lyrics.js";
import { FtpMediaUploader } from "../services/mediaUpload/FtpMediaUploader.js";
import { getMediaUploader } from "../services/mediaUpload/index.js";
import { getPartProvider } from "../services/stream/part-provider/index.js";
import { DbDocument, WithDocument } from "../types/type.js";
import { Aes } from "../utils/crypto/aes.js";
import { fail, ok } from "../utils/reqUtils.js";
import { createLogger } from "../utils/log.js";
import { detectImageMimeType } from "../utils/imageMime.js";
import {
  normalizeVideoChapters,
  syncDefaultVideoChapterTitle
} from "../utils/videoLibrary.js";
import {
  buildUploadRows,
  getPartFileNames,
  mergeArtistNames,
  normalizeProviderPartNumbers,
  type HostFileListing,
  type MediaLookup
} from "./adminLogic.js";

const log = createLogger("Admin");
const routeDir = path.dirname(fileURLToPath(import.meta.url));
const phpAssetDir = path.resolve(routeDir, "..", "scripts", "php");

function isValidId(id: string): boolean {
  return id.length === 12 || id.length === 24;
}

function compactString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function numberOrUndefined(value: unknown): number | undefined {
  if (value === "" || value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildSongUpdate(body: any) {
  return {
    ...(compactString(body.title) ? { title: compactString(body.title) } : {}),
    ...(Array.isArray(body.artist) ? { artist: mergeArtistNames(body.artist) } : {}),
    ...(numberOrUndefined(body.trackNo) != null
      ? { trackNo: numberOrUndefined(body.trackNo) }
      : {}),
    ...(isValidId(String(body.album ?? "")) ? { album: body.album } : {})
  };
}

function buildVideoUpdate(body: any) {
  return {
    ...(compactString(body.title) ? { title: compactString(body.title) } : {}),
    ...(Array.isArray(body.artist) ? { artist: mergeArtistNames(body.artist) } : {}),
    ...(Array.isArray(body.genre) ? { genre: mergeArtistNames(body.genre) } : {}),
    ...(numberOrUndefined(body.year) != null ? { year: numberOrUndefined(body.year) } : {}),
    ...(Array.isArray(body.chapters) ? { chapters: body.chapters } : {})
  };
}

function buildAlbumUpdate(body: any) {
  return {
    ...(compactString(body.title) ? { title: compactString(body.title) } : {}),
    ...(compactString(body.artist) ? { artist: compactString(body.artist) } : {}),
    ...(Array.isArray(body.genre) ? { genre: mergeArtistNames(body.genre) } : {}),
    ...(numberOrUndefined(body.year) != null ? { year: numberOrUndefined(body.year) } : {})
  };
}

function albumPublicProjection(album: any) {
  return {
    ...album,
    hasCover: Boolean(album.cover)
  };
}

function publicHost(host: any) {
  return {
    _id: String(host._id),
    name: host.name,
    provider: host.provider ?? host.stream?.antiHotlink ?? "",
    uploadType: host.upload?.type,
    streamType: host.stream?.type,
    host: host.stream?.host ?? "",
    path: host.stream?.path ?? host.upload?.path ?? "",
    ftpRoot: host.upload?.ftpRoot ?? "",
    ftpLimit: host.upload?.ftpLimit ?? 0
  };
}

async function getMediaLookup(ids: string[]): Promise<Map<string, MediaLookup>> {
  const [songs, videos] = await Promise.all([
    Song.find({ _id: { $in: ids } }, { title: 1, fileCount: 1 }).lean(),
    Video.find({ _id: { $in: ids } }, { title: 1, fileCount: 1 }).lean()
  ]);
  const lookup = new Map<string, MediaLookup>();
  songs.forEach((song) =>
    lookup.set(String(song._id), {
      id: String(song._id),
      title: song.title,
      type: "song",
      fileCount: song.fileCount
    })
  );
  videos.forEach((video) =>
    lookup.set(String(video._id), {
      id: String(video._id),
      title: video.title,
      type: "video",
      fileCount: video.fileCount
    })
  );
  return lookup;
}

export async function handleAdminGetUploads(_req, res) {
  const hosts = await Hosting.find({}).exec();
  const listings = await Promise.all(
    hosts.map(async (host) => {
      try {
        const result = await getPartProvider(host, {}).listFiles();
        return {
          hostId: host.id,
          hostName: host.name,
          available: result.available,
          files: normalizeProviderPartNumbers(result.files)
        } satisfies HostFileListing;
      } catch (error) {
        log.warn({ err: error, host: host.name }, "Failed to list admin upload files");
        return { hostId: host.id, hostName: host.name, available: false, files: [] };
      }
    })
  );
  const ids = Array.from(
    new Set(listings.flatMap((listing) => listing.files.map((f) => f.fileName)))
  );
  res.json(buildUploadRows(listings, await getMediaLookup(ids)));
}

export async function handleAdminGetSongs(_req, res) {
  res.json(
    await Song.find({}, { iv: 0 })
      .populate("album", { title: 1, artist: 1, year: 1 })
      .populate("hostingList", { name: 1 })
      .sort({ album: 1, trackNo: 1 })
      .lean()
  );
}

export async function handleAdminGetVideos(_req, res) {
  res.json(
    (
      await Video.find({}, { iv: 0 })
      .populate("hostingList", { name: 1 })
      .sort({ year: -1, title: 1 })
      .lean()
    ).map(({ cover, ...video }) => ({ ...video, hasCover: Boolean(cover) }))
  );
}

export async function handleAdminGetAlbums(_req, res) {
  res.json(
    (
      await Album.find({})
        .populate("trackList", { title: 1 })
        .sort({ year: 1, title: 1 })
        .lean()
    )
      .map(albumPublicProjection)
      .map(({ cover: _cover, ...album }) => album)
  );
}

export async function handleAdminGetHosts(_req, res) {
  res.json((await Hosting.find({}).lean()).map(publicHost));
}

export async function handleAdminGetArtists(_req, res) {
  const [songs, videos, albums, profiles] = await Promise.all([
    Song.find({}, { artist: 1 }).lean(),
    Video.find({}, { artist: 1 }).lean(),
    Album.find({}, { artist: 1 }).lean(),
    ArtistProfile.find({}, { name: 1, image: 1 }).lean()
  ]);
  const rows = new Map<
    string,
    { name: string; songCount: number; videoCount: number; albumCount: number; hasImage: boolean }
  >();
  const ensure = (name: string) => {
    if (!rows.has(name)) {
      rows.set(name, { name, songCount: 0, videoCount: 0, albumCount: 0, hasImage: false });
    }
    return rows.get(name)!;
  };

  songs.forEach((song) =>
    mergeArtistNames(song.artist).forEach((name) => ensure(name).songCount++)
  );
  videos.forEach((video) =>
    mergeArtistNames(video.artist).forEach((name) => ensure(name).videoCount++)
  );
  albums.forEach((album) => {
    const name = compactString(album.artist);
    if (name) ensure(name).albumCount++;
  });
  profiles.forEach((profile) => {
    const row = ensure(profile.name);
    row.hasImage = Boolean(profile.image);
  });

  res.json(Array.from(rows.values()).sort((left, right) => left.name.localeCompare(right.name)));
}

export async function handleAdminGetArtistImage(req, res) {
  const profile = await ArtistProfile.findOne(
    { name: req.params.name },
    { image: 1, imageMimeType: 1 }
  );
  if (!profile?.image) return fail(res, "No artist image", 404);
  res.setHeader("Content-Type", profile.imageMimeType ?? "application/octet-stream");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(profile.image);
}

export async function handleAdminUpdateSong(req, res) {
  if (!isValidId(req.params.id)) return fail(res, "Invalid request");
  const song = await Song.findByIdAndUpdate(req.params.id, buildSongUpdate(req.body), {
    new: true
  }).lean();
  if (!song) return fail(res, "Song not found", 404);
  ok(res);
}

export async function handleAdminUpdateVideo(req, res) {
  if (!isValidId(req.params.id)) return fail(res, "Invalid request");
  const video = await Video.findById(req.params.id);
  if (!video) return fail(res, "Video not found", 404);

  const previousTitle = video.title;
  const update = buildVideoUpdate(req.body);
  Object.assign(video, update);

  if (Array.isArray(req.body.chapters)) {
    video.chapters = normalizeVideoChapters(video.title, req.body.chapters);
  } else if (video.title !== previousTitle) {
    video.chapters = syncDefaultVideoChapterTitle(previousTitle, video.title, video.chapters);
  } else {
    video.chapters = normalizeVideoChapters(video.title, video.chapters);
  }

  await video.save();
  ok(res);
}

export async function handleAdminUpdateVideoCover(req, res) {
  if (!isValidId(req.params.id)) return fail(res, "Invalid request");
  if (!req.file) return fail(res, "Cover image is required", 400);
  if (!detectImageMimeType(req.file.buffer)) return fail(res, "Cover must be a raster image", 400);
  const video = await Video.findByIdAndUpdate(req.params.id, { cover: req.file.buffer });
  if (!video) return fail(res, "Video not found", 404);
  ok(res);
}

export async function handleAdminUpdateAlbum(req, res) {
  if (!isValidId(req.params.id)) return fail(res, "Invalid request");
  const album = await Album.findByIdAndUpdate(req.params.id, buildAlbumUpdate(req.body), {
    new: true
  }).lean();
  if (!album) return fail(res, "Album not found", 404);
  ok(res);
}

export async function handleAdminUpdateAlbumCover(req, res) {
  if (!isValidId(req.params.id)) return fail(res, "Invalid request");
  if (!req.file) return fail(res, "Cover image is required");
  const album = await Album.findByIdAndUpdate(req.params.id, { cover: req.file.buffer });
  if (!album) return fail(res, "Album not found", 404);
  ok(res);
}

export async function handleAdminUpdateHost(req, res) {
  if (!isValidId(req.params.id)) return fail(res, "Invalid request");
  const host = await Hosting.findById(req.params.id);
  if (!host) return fail(res, "Host not found", 404);
  const name = compactString(req.body.name);
  const provider = compactString(req.body.provider);
  const streamHost = compactString(req.body.host);
  const path = compactString(req.body.path);
  if (name) host.name = name;
  if (provider) host.provider = provider as any;
  if (host.stream?.type === StreamStrategy.HTTP) {
    if (streamHost) host.stream.host = streamHost;
    if (path) host.stream.path = path;
    if (provider) host.stream.antiHotlink = provider as any;
  }
  if (host.upload?.type === UploadStrategy.FTP) {
    if (path) host.upload.path = path;
    const ftpLimit = numberOrUndefined(req.body.ftpLimit);
    if (ftpLimit != null) host.upload.ftpLimit = ftpLimit;
  }
  await host.save();
  ok(res);
}

export async function handleAdminCreateHost(req, res) {
  if (!process.env.DB_STORE_PW) return fail(res, "No env found");
  const aes = new Aes(process.env.DB_STORE_PW);
  const ftpCredential = req.body?.ftpCredential ?? {};
  const name = compactString(req.body?.name) ?? compactString(req.body?.host) ?? "unknown";
  const provider = compactString(req.body?.provider);
  const ftpRoot = compactString(req.body?.ftpRoot) ?? "/htdocs";
  const uploadPath = compactString(req.body?.path) ?? "/audio";
  const ftpLimit = numberOrUndefined(req.body?.ftpLimit) ?? PARTSIZE;
  const plainCredential = {
    host: compactString(ftpCredential.host) ?? "",
    user: compactString(ftpCredential.user ?? ftpCredential.username) ?? "",
    password: String(ftpCredential.password ?? ""),
    port: numberOrUndefined(ftpCredential.port) ?? 21
  };
  const host = new Hosting({
    name,
    upload: {
      type: UploadStrategy.FTP,
      ftpCredential: {
        ...plainCredential,
        password: aes.encrypt(plainCredential.password)
      },
      ftpRoot,
      path: uploadPath,
      ftpLimit,
      ftpExt: []
    },
    stream: {
      type: StreamStrategy.HTTP,
      host: compactString(req.body?.host) ?? compactString(ftpCredential.host) ?? name,
      path: uploadPath,
      partSize: ftpLimit,
      ...(provider ? { antiHotlink: provider } : {})
    },
    ...(provider ? { provider } : {})
  });
  await host.save();

  const uploader = new FtpMediaUploader();
  await uploader.init({
    type: UploadStrategy.FTP,
    ftpCredential: plainCredential,
    ftpRoot,
    path: uploadPath,
    ftpLimit,
    ftpExt: []
  });
  try {
    await uploader.ftpClient?.mkdir(`${ftpRoot}${uploadPath}`);
    await uploader.uploadFile(
      await readFile(path.join(phpAssetDir, "sync.php")),
      () => "sync.php",
      ""
    );
    await uploader.uploadFile(
      await readFile(path.join(phpAssetDir, "status.php")),
      () => "status.php",
      ""
    );
  } finally {
    await uploader.end();
  }
  res.json({ id: host.id });
}

async function deleteRemoteMediaFiles(media: DbDocument<any>): Promise<void> {
  const hosts = (media.hostingList ?? []) as WithDocument<IHosting>[];
  if (hosts.length === 0 || media.fileCount <= 0) return;
  const fileNames = getPartFileNames(media.id, media.fileCount, media.fileExtension);
  for (const host of hosts) {
    const uploader = getMediaUploader(host.upload);
    try {
      await uploader.init(host.upload);
      await uploader.deleteFiles(fileNames);
    } finally {
      await uploader.end();
    }
  }
}

export async function handleAdminDeleteSong(req, res) {
  if (!isValidId(req.params.id)) return fail(res, "Invalid request");
  const song = await Song.findById(req.params.id).populate("hostingList").exec();
  if (!song) return fail(res, "Song not found", 404);
  try {
    await deleteRemoteMediaFiles(song);
    await Promise.all([
      Album.updateMany({}, { $pull: { trackList: song._id } }),
      Playlist.updateMany(
        {},
        { $pull: { songs: song._id, items: { mediaType: "audio", mediaId: song._id } } }
      ),
      Lyrics.deleteOne({ mediaType: "audio", mediaId: song._id }),
      Song.findByIdAndDelete(song._id)
    ]);
    ok(res);
  } catch (error) {
    log.error({ err: error }, "Failed to delete song media files");
    fail(res, `Failed to delete remote media files: ${error}`, 500);
  }
}

export async function handleAdminDeleteVideo(req, res) {
  if (!isValidId(req.params.id)) return fail(res, "Invalid request");
  const video = await Video.findById(req.params.id).populate("hostingList").exec();
  if (!video) return fail(res, "Video not found", 404);
  try {
    await deleteRemoteMediaFiles(video);
    await Promise.all([
      Playlist.updateMany({}, { $pull: { items: { mediaType: "video", mediaId: video._id } } }),
      Lyrics.deleteOne({ mediaType: "video", mediaId: video._id }),
      Video.findByIdAndDelete(video._id)
    ]);
    ok(res);
  } catch (error) {
    log.error({ err: error }, "Failed to delete video media files");
    fail(res, `Failed to delete remote media files: ${error}`, 500);
  }
}

export async function handleAdminDeleteAlbum(req, res) {
  if (!isValidId(req.params.id)) return fail(res, "Invalid request");
  const albumId = new Types.ObjectId(req.params.id);
  await Promise.all([
    Song.updateMany({ album: albumId }, { $unset: { album: "" } }),
    Album.findByIdAndDelete(albumId)
  ]);
  ok(res);
}

export async function handleAdminDeleteHost(req, res) {
  if (!isValidId(req.params.id)) return fail(res, "Invalid request");
  await Promise.all([
    Song.updateMany({ hostingList: req.params.id }, { $pull: { hostingList: req.params.id } }),
    Video.updateMany({ hostingList: req.params.id }, { $pull: { hostingList: req.params.id } }),
    Hosting.findByIdAndDelete(req.params.id)
  ]);
  ok(res);
}

export async function handleAdminRenameArtist(req, res) {
  const from = decodeURIComponent(req.params.name).trim();
  const to = compactString(req.body?.name);
  if (!from || !to) return fail(res, "Artist names are required");
  await Promise.all([
    Song.updateMany({ artist: from }, { $set: { "artist.$": to } }),
    Video.updateMany({ artist: from }, { $set: { "artist.$": to } }),
    Album.updateMany({ artist: from }, { $set: { artist: to } })
  ]);
  const existing = await ArtistProfile.findOne({ name: from });
  if (existing) {
    await ArtistProfile.updateOne(
      { name: to },
      {
        $set: {
          image: existing.image,
          imageMimeType: existing.imageMimeType
        }
      },
      { upsert: true }
    );
    await ArtistProfile.deleteOne({ name: from });
  }
  ok(res);
}

export async function handleAdminUpdateArtistImage(req, res) {
  const name = decodeURIComponent(req.params.name).trim();
  if (!name) return fail(res, "Artist name is required");
  if (!req.file) return fail(res, "Image file is required");
  await ArtistProfile.updateOne(
    { name },
    { $set: { name, image: req.file.buffer, imageMimeType: req.file.mimetype } },
    { upsert: true }
  );
  ok(res);
}
