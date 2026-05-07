import path from "node:path";
import { Readable } from "node:stream";
import { readFile } from "node:fs/promises";
import { PARTSIZE } from "../const.js";
import { Aes } from "../crypto/aes.js";
import { Album } from "../db/Album.js";
import { Hosting, IHosting } from "../db/Hosting.js";
import { dbClient } from "../db/Mongo.js";
import { Song } from "../db/Song.js";
import { Video } from "../db/Video.js";
import { FtpMediaUploader } from "../media_upload/FtpMediaUploader.js";
import { getPartProvider } from "../stream/part_provider/index.js";
import { fail, ok } from "../utils/reqUtils.js";
import { WithDocument } from "../utils/type.js";

const __dirname = path.resolve();

// GET /api/hosts
export async function handleGetHosts(req, res) {
const hostings = await Hosting.find(
  {},
  {
    host: 1,
    provider: 1,
    path: 1
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

    // Map frontend username to backend user field
    const ftpCredential = req.body?.ftpCredential;
    if (ftpCredential?.username && !ftpCredential?.user) {
      ftpCredential.user = ftpCredential.username;
      delete ftpCredential.username;
    }

    const data: IHosting = {
      ftpLimit: PARTSIZE,
      ftpExt: [],
      ...req.body,
      ftpCredential: {
        ...ftpCredential,
        password: aes.encrypt(ftpCredential?.password)
      } as IHosting["ftpCredential"]
    };
    let host = await Hosting.findOne({
      host: req.body?.host
    });
    if (host == null) {
      host = new Hosting(data);
    } else {
      Object.assign(host, data);
    }

    await host.save();

    // ftpHost
    const ftpHost = {
      ...data,
      ftpCredential: {
        ...data.ftpCredential,
        password: ftpCredential?.password
      }
    };

    const up = new FtpMediaUploader();
    await up.init(ftpHost.ftpRoot, ftpHost.path, ftpHost.ftpCredential, ftpHost.ftpLimit, ftpHost.ftpExt);

    // Create FTP directory (ftpRoot + path) for first-time setup
    await up.ftpClient?.mkdir(`${host.ftpRoot}${host.path}`);

    // Upload PHP files to ftpRoot only (without path)
    await up.uploadFile(
      await readFile(path.join(__dirname, "src", "php", "sync.php")),
      () => "sync.php",
      ""  // upload to ftpRoot only
    );
    await up.uploadFile(
      await readFile(path.join(__dirname, "src", "php", "status.php")),
      () => "status.php",
      ""  // upload to ftpRoot only
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

  // remove hosting from song
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
  // delete song without any hosting
  const delResult = await Song.deleteMany({
    hostingList: []
  });
  console.log(`Deleted ${delResult.deletedCount} songs!`);

  const delVResult = await Video.deleteMany({
    hostingList: [],
    youtubeUrl: null
  });
  console.log(`Deleted ${delVResult.deletedCount} videos!`);

  // delete host from database
  const delHostResult = await Hosting.findByIdAndDelete(req.params.id);
  if (delHostResult) {
    console.log(`Deleted host: ${delHostResult.host}`);
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
        host: hostingsMap[hostId].host
      })),
      patialHosted: [...patialHosted].map((hostId) => ({
        id: hostingsMap[hostId].id,
        host: hostingsMap[hostId].host
      })),
      notHosted: [...notHosted].map((hostId) => ({
        id: hostingsMap[hostId].id,
        host: hostingsMap[hostId].host
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
