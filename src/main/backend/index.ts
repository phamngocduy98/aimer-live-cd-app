import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import multer from "multer";
import path from "node:path";
import { Readable } from "node:stream";
import { v2 as webdav } from "webdav-server";

import axios from "axios";
import { readFile } from "node:fs/promises";
import { PARTSIZE } from "./const.js";
import { Aes } from "./crypto/aes.js";
import { Album } from "./db/Album.js";
import { Hosting, IHosting } from "./db/Hosting.js";
import { dbClient } from "./db/Mongo.js";
import { ISong, Song } from "./db/Song.js";
import { IVideo, Video } from "./db/Video.js";
import { FtpMediaUploader } from "./media_upload/FtpMediaUploader.js";
import { uploadSongAPI } from "./media_upload/index.js";
import { getPartProvider } from "./stream/part_provider/index.js";
import { SongStream } from "./stream/SongStream.js";
import { fail, ok } from "./utils/reqUtils.js";
import { DbDocument, WithDocument } from "./utils/type.js";
import { WebdavServer } from "./webdav/webdav.js";

const __dirname = path.resolve();
const webdavServer = new WebdavServer();

const app = express();
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(cors());
const staticPath = path.join(__dirname, "src", "client");
console.log(`[ ${"Serve static".padStart(15)} ] ${staticPath}`);
app.use("/", express.static(staticPath));
app.use(webdav.extensions.express("/webdav", webdavServer.server));

const upload = multer();

app.post("/api/videos/youtube/:albumId?", async (req, res) => {
  try {
    const data: IVideo = {
      ...req.body,
      genre: undefined,
      cover: undefined,
      year: undefined
    };
    const albumId = req.params.albumId;
    const album =
      (await Album.findById(albumId, {
        videoList: 1
      })) ??
      new Album({
        artist: data.artist[0] ?? "Unknown",
        genre: req.body.genre ?? "Youtube",
        title: data.title,
        trackList: [],
        videoList: [],
        cover: req.body.cover
          ? (
              await axios.get(req.body.cover, {
                responseType: "arraybuffer"
              })
            ).data
          : null,
        year: req.body.year ?? new Date().getFullYear()
      });
    const video =
      (await Video.findOne({
        title: data.title,
        format: "youtube"
      })) ??
      new Video({
        ...data,
        hostingList: [],
        fileCount: 0,
        bitrate: 0,
        size: 0,
        format: "youtube",
        audioLossless: false,
        fileExtension: "mp4",
        album
      });

    const set = new Set<string>();
    album.videoList.push(video);
    album.videoList = (album.videoList as DbDocument<IVideo>[]).filter((v) => {
      const id = v._id.toHexString();
      if (!set.has(id)) {
        set.add(id);
        return true;
      }
      return false;
    });

    const vid = await video.save();
    await album.save();
    ok(res, vid.id);
  } catch (e) {
    console.error(e);
    fail(res, `${e}`);
  }
});

app.post("/api/upload/:hostId?", upload.single("audio"), async (req, res) => {
  const file = req.file;
  if (file == null) {
    return fail(res, "API not found");
  }
  const skipPart = parseInt((req.query["skipPart"] as string) ?? "0");
  const limitPart = parseInt((req.query["limitPart"] as string) ?? "-1");
  const fileExt = file.originalname.split(".").at(-1)!;
  try {
    await uploadSongAPI(
      file.buffer,
      fileExt,
      skipPart,
      limitPart === -1 ? undefined : limitPart,
      req.params.hostId
    );
    ok(res);
  } catch (e) {
    console.error(e);
    fail(res, `${e}`);
  }
});

app.post("/api/upload-album/:hostId?", upload.array("audios"), async (req, res) => {
  const files = req.files! as Express.Multer.File[];
  if (!files || files.length == 0) {
    return fail(res, "API not found");
  }
  let skipPart = parseInt((req.query["skipPart"] as string) ?? "0");
  const limitPart = parseInt((req.query["limitPart"] as string) ?? "-1");
  try {
    for (let file of files) {
      const fileExt = file.originalname.split(".").at(-1)!;
      await uploadSongAPI(
        file.buffer,
        fileExt,
        skipPart,
        limitPart === -1 ? undefined : limitPart,
        req.params.hostId
      );
      skipPart = 0; // skip first file only
    }
    ok(res);
  } catch (e) {
    console.error(e);
    fail(res, `${e}`);
  }
});

app.post("/api/videos/:videoId/chapters", bodyParser.text({ type: "*/*" }), async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (video == null) {
      return fail(res, "Video not found");
    }
    const data = (req.body as string).split("\n");
    const data2 = data
      .map((d) => d.split(" "))
      .map((d) => ({ time: d[0], title: d.slice(1).join(" ") }));
    const data3 = data2
      .map((d) => ({ ...d, title: d.title.split(" - ") }))
      .map((d) => ({ ...d, title: d.title[0], subTitle: d.title[1] }));
    const parstTime = (t: string) => {
      const sp = t.split(":");
      return parseInt(sp[0]) * 60 + parseInt(sp[1]);
    };

    video.chapters = data3.map((d) => ({ ...d, time: parstTime(d.time) }));
    await video.save();
    ok(res);
  } catch (e) {
    console.error(e);
    fail(res, `${e}`);
  }
});

app.get("/api/hosts", async (req, res) => {
  const hostings = await Hosting.find(
    {},
    {
      host: 1,
      provider: 1
    }
  )
    .lean()
    .exec();
  res.send(hostings);
  res.end();
});

app.post("/api/hosts", async (req, res) => {
  if (!process.env.local) fail(res, "No api found");
  try {
    const aes = new Aes(process.env.DB_STORE_PW!);
    const data: IHosting = {
      ftpLimit: PARTSIZE,
      ftpExt: [],
      ...req.body,
      ftpCredential: {
        ...req.body?.ftpCredential,
        password: aes.encrypt(req.body?.ftpCredential?.password)
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

    const up = new FtpMediaUploader();
    await up.init(req.body);

    await up.ftpClient?.mkdir((req.body as IHosting).ftpRoot);

    await up.uploadFile(
      await readFile(path.join(__dirname, "src", "php", "sync.php")),
      () => "sync.php"
    );
    await up.uploadFile(
      await readFile(path.join(__dirname, "src", "php", "status.php")),
      () => "status.php"
    );
    await up.end();
    ok(res, `${host.id}`);
  } catch (e) {
    console.error(e);
    fail(res, `${e}`);
  }
});

app.delete("/api/hosts/:id", async (req, res) => {
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
  console.log(`Deleled ${delResult.deletedCount} songs!`);

  const delVResult = await Video.deleteMany({
    hostingList: [],
    youtubeUrl: null
  });
  console.log(`Deleled ${delVResult.deletedCount} videos!`);
  ok(res);
});

app.get("/api/albums", async (req, res) => {
  const page = parseInt((req.query.page as string) ?? "0");
  const pageSize = parseInt((req.query.pageSize as string) ?? "30");
  const albums = await Album.find(
    {},
    {
      title: 1,
      artist: 1
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
});

app.get("/api/album/:id", async (req, res) => {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");
  const album = await Album.findById(req.params.id, {
    cover: 0
  })
    .populate("trackList", {
      hostingList: 0,
      iv: 0,
      album: 0,
      fileList: 0
    })
    .populate("videoList", {
      hostingList: 0,
      iv: 0,
      album: 0,
      fileList: 0
    })
    .lean()
    .exec();
  if (album == null) return fail(res, "Album not found");
  res.send(album);
  res.end();
});

app.get("/api/album/:id/backup", async (req, res) => {
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
});

app.post("/api/album/:id/backup/:hostid", async (req, res) => {
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
    const targetHosting = await dbClient.findHosting(req.params.hostid);
    if (targetHosting == null) throw Error("hosting not found");

    // TODO: videoList support
    for (let song of album.trackList as WithDocument<ISong>[]) {
      // find a working hosting to fetch part
      for (let hosting of song.hostingList) {
        const stream = getPartProvider(hosting, req.headers);
        const partSize = Math.min(PARTSIZE, song.size, hosting.ftpLimit);

        const notHosted =
          (song.hostingList as WithDocument<IHosting>[]).findIndex((h) =>
            h._id.equals(targetHosting._id)
          ) === -1;
        if (notHosted && partSize <= targetHosting.ftpLimit) {
          try {
            await stream.backup(
              song as WithDocument<ISong>,
              targetHosting as WithDocument<IHosting>
            );
            song.hostingList.push(targetHosting);
            await song.save();
            break;
          } catch (e: any) {
            console.log(`[ ${"Backup!".padStart(15)} ] ERR: hosting ${e?.message}`);
            continue;
          }
        }
      }
    }
  } catch (e) {
    console.log(e);
    fail(res, "done");
  }

  ok(res);
});

app.post("/api/album/:id/backup2/:hostid", async (req, res) => {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");

  const skipExist = req.query["skipExist"] != null;
  let skipPart = parseInt((req.query["skipPart"] as string) ?? "0");
  const limitPart = parseInt((req.query["limitPart"] as string) ?? "99999999999");

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
    const targetHosting = await dbClient.findHosting(req.params.hostid);
    if (targetHosting == null) throw Error("hosting not found");
    const songs: (DbDocument<ISong> | DbDocument<IVideo>)[] = [
      ...(album.trackList as DbDocument<ISong>[]),
      ...(album.videoList as DbDocument<IVideo>[])
    ];
    for (let song of songs) {
      const stream = getPartProvider(targetHosting, req.headers);

      const availableParts = new Set((await stream.get("status.php")).data.split(","));

      try {
        for (let i = skipPart; i < skipPart + limitPart && i < song.fileCount; i++) {
          if (req.closed) {
            throw Error("Client aborted");
          }
          const fileName = `${`${song.id}${i == 0 ? "" : `_${i}`}`}.${song.fileExtension}`;

          if (availableParts.has(fileName) && skipExist) {
            console.log(`[ ${`Backup ${i}/${song.fileCount}`.padStart(15)} ] ${fileName} SKIP`);
            continue;
          }

          console.log(`[ ${`Backup ${i}/${song.fileCount}`.padStart(15)} ] ${fileName}`);
          const res = await stream.get(`sync.php?id=${song.id}&file=${fileName}`, undefined);
          const resp = res.data;
          if (resp !== "ok") throw Error(resp);
        }

        const notHosted =
          (song.hostingList as WithDocument<IHosting>[]).findIndex((h) =>
            h._id.equals(targetHosting._id)
          ) === -1;
        if (notHosted) {
          song.hostingList.push(targetHosting);
        }

        await song.save();
        break;
      } catch (e: any) {
        console.log(`[ ${"Backup (sync)".padStart(15)} ] ERR: hosting ${e?.message}`);
        continue;
      }
    }
    ok(res);
  } catch (e) {
    console.log(e);
    fail(res, "done");
  }
});

app.get("/api/album/:id/cover", async (req, res) => {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");
  const album = await Album.findById(req.params.id, { cover: 1 }).exec();
  if (album?.cover) {
    Readable.from(album.cover).pipe(res);
  } else {
    fail(res, "No cover image");
  }
});

app.get("/api/song/:id", async (req, res) => {
  const song = await Song.findById(req.params.id, {
    iv: 0,
    hostingList: 0,
    fileList: 0
  })
    .populate("album", {
      trackList: 0,
      videoList: 0
    })
    .lean()
    .exec();
  res.send(song);
  res.end();
});

app.get("/api/stream/:id", async (req, res) => {
  fail(res, "Deprecated api", 404);
});

app.get("/api/part/:id/:fileName", async (req, res) => {
  // createReadStream(
  //   path.join(__dirname, "test", "mp3", "6740cde11592cb69242db122_64.mp4")
  // ).pipe(res);

  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");
  if (req.params.fileName.length == 0) return fail(res, "Invalid request");

  let song: DbDocument<ISong> | DbDocument<IVideo> | null;
  song = await Song.findById(req.params.id).populate("hostingList").exec();
  if (song == null) {
    song = await Video.findById(req.params.id).populate("hostingList").exec();
  }
  if (song == null) {
    return fail(res, "Song not found", 404);
  }

  for (let hosting of song.hostingList) {
    try {
      console.log(
        `[ ${"Raw Part".padStart(15)} ] Get part ${req.params.fileName} from ${hosting.host}`
      );
      const provider = getPartProvider(hosting, {});
      const stream = await provider.get(req.params.fileName, {});
      res?.writeHead(206, "Partial Content", stream.headers as any);
      console.log(`[ ${"Raw Part".padStart(15)} ] Part ok, streaming`);
      (stream.data as Readable).pipe(res);
      return;
    } catch (e: any) {
      console.error(
        `[ ${"Raw Part".padStart(15)} ] Fail to load from hosting ${hosting.host}: ${e}`
      );
    }
  }
  fail(res, "No part available");
});

app.get("/api/stream/audio/:id", async (req, res) => {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");
  const song = await Song.findById(req.params.id).populate("hostingList").exec();

  if (song == null) {
    return fail(res, "Song not found", 404);
  }
  let errorMessages: string[] = [];
  try {
    const stream = new SongStream(req.headers);
    await stream.stream(song, res, res);
    return;
  } catch (e) {
    errorMessages.push((e as Error).message);
  }

  fail(res, errorMessages.join(". "), 404);
});

app.get("/api/stream/video/:id", async (req, res) => {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");
  const video = await Video.findById(req.params.id).populate("hostingList").exec();

  if (video == null) {
    return fail(res, "Video not found", 404);
  }

  let errorMessages: string[] = [];
  try {
    const stream = new SongStream(req.headers);

    req.on("error", (e) => {
      console.error("[Error] Client request " + e);
      stream.stopStream();
      res.end();
    });

    stream.stream(video, res, res);
    return;
  } catch (e) {
    errorMessages.push((e as Error).message);
  }

  fail(res, errorMessages.join(". "), 404);
});

app.get("/api/song/:id/cover", async (req, res) => {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");
  const song = await Song.findById(req.params.id).populate("album", { cover: 1 }).exec();
  res.setHeader("Cache-Control", "public, max-age=86400");
  if (song?.album?.cover) {
    Readable.from(song.album.cover).pipe(res);
  } else {
    fail(res, "No cover image");
  }
});

app.get("/api/artist/:name/top-tracks", async (req, res) => {
  // if (req.params.id.length !== 12 && req.params.id.length !== 24)
  //   return fail(res, "Invalid request");

  const songs = await Song.find(
    {
      artist: req.params.name
    },
    { iv: 0, hostingList: 0, fileList: 0 }
  )
    .populate("album", { title: 1, artist: 1 })
    .exec();
  res.send(songs);
  res.end();
});

app.get("/*", (req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

export async function startServer(port: number): Promise<void> {
  await dbClient.connect();
  console.log(`[ ${"Status".padStart(15)} ] DB connected`);
  await webdavServer.init();
  console.log(`[ ${"Status".padStart(15)} ] Webdav served at /webdav`);

  app.listen(port, () =>
    console.log(`[ ${"Status".padStart(15)} ] Stream server listening on port ${port}!`)
  );
}
