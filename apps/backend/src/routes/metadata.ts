import path from "node:path";
import { Readable } from "node:stream";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PARTSIZE } from "../config/const.js";
import { Aes } from "../utils/crypto/aes.js";
import { Album } from "../models/Album.js";
import { ArtistProfile } from "../models/ArtistProfile.js";
import { Hosting, IHosting, UploadStrategy, StreamStrategy } from "../models/Hosting.js";
import { dbClient } from "../db/Mongo.js";
import { Song } from "../models/Song.js";
import { Video } from "../models/Video.js";
import { FtpMediaUploader } from "../services/mediaUpload/FtpMediaUploader.js";
import { getPartProvider } from "../services/stream/part-provider/index.js";
import { formatPartRanges } from "../utils/stream/partRanges.js";
import { fail, ok } from "../utils/reqUtils.js";
import { WithDocument } from "../types/type.js";
import { createLogger } from "../utils/log.js";
import { detectImageMimeType } from "../utils/imageMime.js";
import { findMatchingVideoChapters } from "./searchLogic.js";

const log = createLogger("Metadata");

const routeDir = path.dirname(fileURLToPath(import.meta.url));
const phpAssetDir = path.resolve(routeDir, "..", "scripts", "php");

// GET /api/hosts
export async function handleGetHosts(_req, res) {
  const hostings = await Hosting.find(
    {},
    {
      name: 1,
      provider: 1,
      "upload.type": 1,
      "stream.type": 1,
      "stream.host": 1,
      "stream.path": 1
    }
  )
    .lean()
    .exec();
  res.send(hostings);
  res.end();
}

// POST /api/hosts
export async function handleCreateHost(req, res) {
  if (!process.env.DB_STORE_PW) return fail(res, "No env found");
  try {
    const aes = new Aes(process.env.DB_STORE_PW!);

    const ftpCredential = req.body?.ftpCredential;
    if (ftpCredential?.username && !ftpCredential?.user) {
      ftpCredential.user = ftpCredential.username;
      delete ftpCredential.username;
    }

    const name = req.body?.name ?? req.body?.host ?? "unknown";
    const provider = req.body?.provider;
    const ftpRoot = req.body?.ftpRoot ?? "/htdocs";
    const ftpPath = req.body?.path ?? "/audio";
    const ftpLimit = req.body?.ftpLimit ?? PARTSIZE;
    const ftpExt = req.body?.ftpExt ?? [];
    const streamConfig = {
      type: StreamStrategy.HTTP,
      host: req.body?.host ?? ftpCredential?.host ?? name,
      path: ftpPath,
      partSize: ftpLimit,
      ...(provider ? { antiHotlink: provider } : {})
    };

    const data: IHosting = {
      name,
      upload: {
        type: UploadStrategy.FTP,
        ftpCredential: {
          ...ftpCredential,
          password: aes.encrypt(ftpCredential?.password)
        },
        ftpRoot,
        path: ftpPath,
        ftpLimit,
        ftpExt
      },
      stream: streamConfig,
      ...(provider ? { provider } : {})
    };

    let host = await Hosting.findOne({
      name
    });
    if (host == null) {
      host = new Hosting(data);
    } else {
      Object.assign(host, data);
    }

    await host.save();

    // FTP setup: create directory and upload PHP files
    const up = new FtpMediaUploader();
    const plainCredential = { ...ftpCredential, password: ftpCredential?.password };
    const setupConfig = {
      type: UploadStrategy.FTP,
      ftpCredential: plainCredential,
      ftpRoot,
      path: ftpPath,
      ftpLimit,
      ftpExt
    };
    await up.init(setupConfig);

    await up.ftpClient?.mkdir(`${ftpRoot}${ftpPath}`);

    await up.uploadFile(
      await readFile(path.join(phpAssetDir, "sync.php")),
      () => "sync.php",
      ""
    );
    await up.uploadFile(
      await readFile(path.join(phpAssetDir, "status.php")),
      () => "status.php",
      ""
    );
    await up.end();
    ok(res, `${host.id}`);
  } catch (e) {
    log.error({ err: e }, "Failed to create host");
    fail(res, `${e}`);
  }
}

// DELETE /api/hosts/:id
export async function handleDeleteHost(req, res) {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");

  const upResult = await Song.updateMany(
    {
      hostingList: req.params.id
    },
    {
      $pull: {
        hostingList: req.params.id
      }
    }
  );
  log.info(`Updated ${upResult.modifiedCount} songs!`);

  const upVResult = await Video.updateMany(
    {
      hostingList: req.params.id
    },
    {
      $pull: {
        hostingList: req.params.id
      }
    }
  );
  log.info(`Updated ${upVResult.modifiedCount} videos!`);

  const songsToDel = await Song.find({ hostingList: [] }, { _id: 1 }).lean();
  const songIds = songsToDel.map((s) => s._id);
  if (songIds.length > 0) {
    await Album.updateMany({}, { $pull: { trackList: { $in: songIds } } });
    log.info(`Cleaned ${songIds.length} song refs from albums`);
  }
  const delResult = await Song.deleteMany({
    hostingList: []
  });
  log.info(`Deleted ${delResult.deletedCount} songs!`);

  const delVResult = await Video.deleteMany({
    hostingList: [],
    youtubeUrl: null
  });
  log.info(`Deleted ${delVResult.deletedCount} videos!`);

  const delHostResult = await Hosting.findByIdAndDelete(req.params.id);
  if (delHostResult) {
    log.info(`Deleted host: ${delHostResult.name}`);
  } else {
    log.warn(`Host not found: ${req.params.id}`);
  }

  ok(res);
}

export async function enrichFileList(
  files: { fileName: string; partNumbers: number[] }[]
): Promise<
  { fileName: string; parts: string; partNumbers: number[]; title: string; fileCount: number }[]
> {
  const fileNames = files.map((f) => f.fileName);
  const [songs, videos] = await Promise.all([
    Song.find({ _id: { $in: fileNames } }, { title: 1, fileCount: 1, _id: 1 }).lean(),
    Video.find({ _id: { $in: fileNames } }, { title: 1, fileCount: 1, _id: 1 }).lean()
  ]);

  const metaMap = new Map<string, { title: string; fileCount: number }>();
  songs.forEach((s) => metaMap.set(s._id.toString(), { title: s.title, fileCount: s.fileCount }));
  videos.forEach((v) => metaMap.set(v._id.toString(), { title: v.title, fileCount: v.fileCount }));

  return files.map((f) => {
    const meta = metaMap.get(f.fileName) || { title: "Unknown", fileCount: 0 };
    return {
      fileName: f.fileName,
      parts: formatPartRanges(f.partNumbers),
      partNumbers: f.partNumbers,
      title: meta.title,
      fileCount: meta.fileCount
    };
  });
}

// GET /api/hosts/:id/files
export async function handleListHostFiles(req, res) {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");

  try {
    const host = await Hosting.findById(req.params.id).exec();
    if (!host) return fail(res, "Host not found");

    const provider = getPartProvider(host, {});
    const result = await provider.listFiles();
    const enriched = await enrichFileList(result.files);

    return res.json({ available: result.available, files: enriched });
  } catch (error) {
    log.error({ err: error }, "List host files error");
    return fail(res, `Failed to list host files: ${error}`);
  }
}

// GET /api/albums
export async function handleGetAlbums(req, res) {
  const page = parseInt((req.query.page as string) ?? "0");
  const pageSize = parseInt((req.query.pageSize as string) ?? "30");
  const albums = await Album.find(
    {
      "trackList.0": { $exists: true }
    },
    {
      title: 1,
      artist: 1,
      year: 1
    }
  )
    .skip(page * pageSize)
    .limit(pageSize)
    .sort({
      year: 1
    })
    .lean()
    .exec();
  res.send(albums);
  res.end();
}

// GET /api/album/:id
export async function handleGetAlbum(req, res) {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");
  const album = await Album.findById(req.params.id, {
    cover: 0
  })
    .populate("trackList", {
      hostingList: 0,
      iv: 0,
      album: 0
    })
    .lean()
    .exec();
  if (album == null) return fail(res, "Album not found");
  res.send(album);
  res.end();
}

// GET /api/album/:id/backup
export async function handleGetAlbumBackup(req, res) {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");
  const album = await Album.findById(req.params.id, {
    trackList: 1
  })
    .populate({
      path: "trackList",
      populate: {
        path: "hostingList"
      }
    })
    .exec();
  if (album == null) return fail(res, "Album not found");

  try {
    const hostings = (await dbClient.listHosting()) as WithDocument<IHosting>[];
    const hostingsMap = hostings.reduce<{
      [k: string]: WithDocument<IHosting>;
    }>((pre, h) => ({ ...pre, [h.id]: h }), {});

    const hosted: Set<string> = new Set();
    const patialHosted: Set<string> = new Set();

    ((album.trackList?.[0]?.hostingList ?? []) as WithDocument<IHosting>[]).forEach((host) =>
      hosted.add(host.id)
    );

    for (const track of album.trackList) {
      const trackHostIds: string[] = (
        (track.hostingList ?? []) as WithDocument<IHosting>[]
      ).map((h) => h.id);
      for (const hostId of trackHostIds) {
        if (!hosted.has(hostId)) {
          patialHosted.add(hostId);
        }
      }
      for (const hostId of hosted) {
        if (!trackHostIds.includes(hostId)) {
          hosted.delete(hostId);
          patialHosted.add(hostId);
        }
      }
    }

    const _hosted = [...hosted, ...patialHosted];
    const notHosted = Object.keys(hostingsMap).filter((hostId) => !_hosted.includes(hostId));
    res.send({
      hosted: [...hosted].map((hostId) => ({
        id: hostingsMap[hostId].id,
        host: hostingsMap[hostId].name
      })),
      patialHosted: [...patialHosted].map((hostId) => ({
        id: hostingsMap[hostId].id,
        host: hostingsMap[hostId].name
      })),
      notHosted: [...notHosted].map((hostId) => ({
        id: hostingsMap[hostId].id,
        host: hostingsMap[hostId].name
      }))
    });
    res.end();
  } catch (e) {
    log.error({ err: e }, "Album backup info error");
    fail(res, "Error");
  }
}

// GET /api/album/:id/cover
export async function handleGetAlbumCover(req, res) {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");
  const album = await Album.findById(req.params.id, { cover: 1 }).exec();
  if (album?.cover) {
    Readable.from(album.cover).pipe(res);
  } else {
    fail(res, "No cover image");
  }
}

// GET /api/songs
export async function handleGetSongs(req, res) {
  const page = parseInt((req.query.page as string) ?? "0");
  const pageSize = parseInt((req.query.pageSize as string) ?? "50");
  const songs = await Song.find(
    {},
    {
      iv: 0,
      hostingList: 0
    }
  )
    .populate("album", {
      title: 1,
      artist: 1
    })
    .skip(page * pageSize)
    .limit(pageSize)
    .sort({
      album: 1,
      trackNo: 1
    })
    .lean()
    .exec();
  res.send(songs);
  res.end();
}

// GET /api/videos
export async function handleGetVideos(req, res) {
  const page = parseInt((req.query.page as string) ?? "0");
  const pageSize = parseInt((req.query.pageSize as string) ?? "50");
  const videos = await Video.find({}, { cover: 0, iv: 0, hostingList: 0 })
    .sort({ year: -1, title: 1 })
    .skip(page * pageSize)
    .limit(pageSize)
    .lean();
  res.send(videos);
  res.end();
}

// GET /api/video/:id
export async function handleGetVideo(req, res) {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");
  const video = await Video.findById(req.params.id, {
    cover: 0,
    iv: 0,
    hostingList: 0
  })
    .lean()
    .exec();
  if (!video) return fail(res, "Video not found", 404);
  res.send(video);
  res.end();
}

// GET /api/video/:id/cover
export async function handleGetVideoCover(req, res) {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");
  const video = await Video.findById(req.params.id, { cover: 1 }).exec();
  // Admins can replace artwork at this stable URL. Revalidate so clients do not
  // keep showing the previous cover after a successful metadata save.
  res.setHeader("Cache-Control", "no-cache");
  if (video?.cover) {
    const contentType = detectImageMimeType(video.cover);
    if (!contentType) return fail(res, "Unsupported cover image", 415);
    res.setHeader("Content-Type", contentType);
    Readable.from(video.cover).pipe(res);
  } else {
    fail(res, "No cover image", 404);
  }
}

// GET /api/song/:id
export async function handleGetSong(req, res) {
  const song = await Song.findById(req.params.id, {
    iv: 0,
    hostingList: 0
  })
    .populate("album", {
      trackList: 0
    })
    .lean()
    .exec();
  res.send(song);
  res.end();
}

// GET /api/song/:id/cover
export async function handleGetSongCover(req, res) {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");
  const song = await Song.findById(req.params.id).populate("album", { cover: 1 }).exec();
  res.setHeader("Cache-Control", "public, max-age=86400");
  if (song?.album?.cover) {
    Readable.from(song.album.cover).pipe(res);
  } else {
    fail(res, "No cover image");
  }
}

// GET /api/artist/:name/top-tracks
export async function handleGetArtistTopTracks(req, res) {
  const songs = await Song.find(
    {
      artist: req.params.name
    },
    { iv: 0, hostingList: 0 }
  )
    .populate("album", { title: 1, artist: 1 })
    .exec();
  res.send(songs);
  res.end();
}

// GET /api/artist/:name/videos
export async function handleGetArtistVideos(req, res) {
  const name = decodeURIComponent(req.params.name ?? "").trim();
  if (!name) return fail(res, "Artist name is required");
  const videos = await Video.find(
    { artist: name },
    { cover: 0, iv: 0, hostingList: 0 }
  )
    .sort({ year: -1, title: 1 })
    .lean();
  res.send(videos);
}

// GET /api/artist/:name/image
export async function handleGetArtistImage(req, res) {
  const name = decodeURIComponent(req.params.name ?? "").trim();
  if (!name) return fail(res, "Artist name is required");
  const profile = await ArtistProfile.findOne({ name }, { image: 1, imageMimeType: 1 });
  if (!profile?.image) return fail(res, "No artist image", 404);
  res.setHeader("Content-Type", profile.imageMimeType ?? "application/octet-stream");
  res.setHeader("Cache-Control", "public, max-age=86400");
  Readable.from(profile.image).pipe(res);
}

// GET /api/search?q=...
export async function handleSearch(req, res) {
  const q = (req.query.q as string)?.trim();
  if (!q) {
    return res.json({ songs: [], albums: [], videos: [], chapters: [] });
  }

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");

  const [albums, songs, videos, chapterVideos] = await Promise.all([
    Album.find(
      {
        $and: [
          { $or: [{ title: regex }, { artist: regex }] },
          { "trackList.0": { $exists: true } }
        ]
      },
      { title: 1, artist: 1, year: 1 }
    )
      .limit(20)
      .lean()
      .exec(),
    Song.find({ $or: [{ title: regex }, { artist: regex }] }, { iv: 0, hostingList: 0 })
      .populate("album", { title: 1, artist: 1 })
      .limit(20)
      .lean()
      .exec(),
    Video.find(
      { $or: [{ title: regex }, { artist: regex }] },
      { cover: 0, iv: 0, hostingList: 0 }
    )
      .sort({ year: -1, title: 1 })
      .limit(20)
      .lean(),
    Video.find(
      { $or: [{ "chapters.title": regex }, { "chapters.subTitle": regex }] },
      { cover: 0, iv: 0, hostingList: 0 }
    )
      .sort({ year: -1, title: 1 })
      .limit(20)
      .lean()
  ]);

  const chapters = findMatchingVideoChapters(chapterVideos, regex, 20);

  res.json({ songs, albums, videos, chapters });
  res.end();
}
