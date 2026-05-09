import path from "node:path";
import { Readable } from "node:stream";
import { readFile } from "node:fs/promises";
import { PARTSIZE } from "../config/const.js";
import { Aes } from "../utils/crypto/aes.js";
import { Album } from "../models/Album.js";
import { Hosting, IHosting, UploadStrategy, StreamStrategy } from "../models/Hosting.js";
import { dbClient } from "../db/Mongo.js";
import { Song } from "../models/Song.js";
import { Video } from "../models/Video.js";
import { FtpMediaUploader } from "../services/mediaUpload/FtpMediaUploader.js";
import { getPartProvider } from "../services/stream/part_provider/index.js";
import { fail, ok } from "../utils/reqUtils.js";
import { WithDocument } from "../types/type.js";

const __dirname = path.resolve();

// GET /api/hosts
export async function handleGetHosts(req, res) {
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
      await readFile(path.join(__dirname, "src", "php", "sync.php")),
      () => "sync.php",
      ""
    );
    await up.uploadFile(
      await readFile(path.join(__dirname, "src", "php", "status.php")),
      () => "status.php",
      ""
    );
    await up.end();
    ok(res, `${host.id}`);
  } catch (e) {
    console.error(e);
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
  console.log(`Updated ${upResult.modifiedCount} songs!`);

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
  console.log(`Updated ${upVResult.modifiedCount} videos!`);

  const delResult = await Song.deleteMany({
    hostingList: []
  });
  console.log(`Deleted ${delResult.deletedCount} songs!`);

  const delVResult = await Video.deleteMany({
    hostingList: [],
    youtubeUrl: null
  });
  console.log(`Deleted ${delVResult.deletedCount} videos!`);

  const delHostResult = await Hosting.findByIdAndDelete(req.params.id);
  if (delHostResult) {
    console.log(`Deleted host: ${delHostResult.name}`);
  } else {
    console.log(`Host not found: ${req.params.id}`);
  }

  ok(res);
}

// GET /api/hosts/:id/ping
export async function handlePingHost(req, res) {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");

  try {
    const host = await Hosting.findById(req.params.id).exec();
    if (!host) return fail(res, "Host not found");

    const provider = getPartProvider(host, {});
    const result = await provider.ping();

    return res.json(result);
  } catch (error) {
    console.error("Ping host error:", error);
    return fail(res, `Failed to ping host: ${error}`);
  }
}

// GET /api/albums
export async function handleGetAlbums(req, res) {
  const page = parseInt((req.query.page as string) ?? "0");
  const pageSize = parseInt((req.query.pageSize as string) ?? "30");
  const albums = await Album.find(
    {},
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
    .populate("videoList", {
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
    trackList: 1,
    videoList: 1
  })
    .populate({
      path: "trackList",
      populate: {
        path: "hostingList"
      }
    })
    .populate({
      path: "videoList",
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
    ((album.videoList?.[0]?.hostingList ?? []) as WithDocument<IHosting>[]).forEach((host) =>
      hosted.add(host.id)
    );

    for (let track of album.trackList) {
      const trackHostIds: string[] = (
        (album.trackList?.[0]?.hostingList ?? []) as WithDocument<IHosting>[]
      ).map((h) => h.id);
      for (let hostId of trackHostIds) {
        if (!hosted.has(hostId)) {
          patialHosted.add(hostId);
        }
      }
      for (let hostId of hosted) {
        if (!trackHostIds.includes(hostId)) {
          hosted.delete(hostId);
          patialHosted.add(hostId);
        }
      }
    }

    for (let track of album.videoList) {
      const trackHostIds: string[] = (
        (album.videoList?.[0]?.hostingList ?? []) as WithDocument<IHosting>[]
      ).map((h) => h.id);
      for (let hostId of trackHostIds) {
        if (!hosted.has(hostId)) {
          patialHosted.add(hostId);
        }
      }
      for (let hostId of hosted) {
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
    console.log(e);
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

// GET /api/song/:id
export async function handleGetSong(req, res) {
  const song = await Song.findById(req.params.id, {
    iv: 0,
    hostingList: 0
  })
    .populate("album", {
      trackList: 0,
      videoList: 0
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
