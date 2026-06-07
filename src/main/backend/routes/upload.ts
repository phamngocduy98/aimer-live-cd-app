import { Writable } from "node:stream";
import { EventEmitter } from "node:events";
import axios from "axios";
import { PARTSIZE } from "../config/const.js";
import { Album } from "../models/Album.js";
import { IHosting, IHttpStreamConfig, StreamStrategy, UploadStrategy } from "../models/Hosting.js";
import { dbClient } from "../db/Mongo.js";
import { ISong, Song } from "../models/Song.js";
import { IVideo, Video } from "../models/Video.js";
import { uploadSongAPI, getMediaUploader } from "../services/mediaUpload/index.js";
import { getPartProvider } from "../services/stream/part-provider/index.js";
import { StreamProvider } from "../services/stream/part-provider/StreamProvider.js";
import { StreamInfo } from "../services/stream/dto/StreamInfo.js";
import { waitStreamClose } from "../utils/stream/stream2buffer.js";
import { fail, ok } from "../utils/reqUtils.js";
import { DbDocument, WithDocument } from "../types/type.js";
import { createLogger } from "../utils/log.js";

const log = createLogger("Upload");
const uploadProgressEvents = new EventEmitter();
uploadProgressEvents.setMaxListeners(100);

function emitUploadProgress(progressId: string | undefined, payload: Record<string, unknown>) {
  if (!progressId) return;
  uploadProgressEvents.emit(progressId, payload);
}

export async function handleUploadProgress(req, res) {
  const progressId = req.params.id;
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });
  const send = (payload: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };
  uploadProgressEvents.on(progressId, send);
  send({ status: "connected" });
  req.on("close", () => uploadProgressEvents.off(progressId, send));
}

// POST /api/videos/youtube/:albumId?
export async function handleYoutubeVideoUpload(req, res) {
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
    log.error({ err: e }, "YouTube video upload failed");
    fail(res, `${e}`);
  }
}

// POST /api/upload/:hostId?
export async function handleFileUpload(req, res) {
  const file = req.file;
  if (file == null) {
    return fail(res, "API not found");
  }
  const skipPart = parseInt((req.query["skipPart"] as string) ?? "0");
  const limitPart = parseInt((req.query["limitPart"] as string) ?? "-1");
  const progressId = req.query["progressId"] as string | undefined;
  const fileExt = file.originalname.split(".").at(-1)!;
  try {
    emitUploadProgress(progressId, { status: "started", fileName: file.originalname });
    const uploaded = await uploadSongAPI(
      file.buffer,
      fileExt,
      skipPart,
      limitPart === -1 ? undefined : limitPart,
      req.params.hostId,
      (progress) => emitUploadProgress(progressId, { status: "uploading", ...progress })
    );
    emitUploadProgress(progressId, { status: "done", ...uploaded });
    res.json(uploaded);
  } catch (e) {
    emitUploadProgress(progressId, { status: "error", message: `${e}` });
    log.error({ err: e }, "File upload failed");
    fail(res, `${e}`);
  }
}

// POST /api/upload-album/:hostId?
export async function handleAlbumUpload(req, res) {
  const files = req.files! as Express.Multer.File[];
  if (!files || files.length == 0) {
    return fail(res, "API not found");
  }
  let skipPart = parseInt((req.query["skipPart"] as string) ?? "0");
  const limitPart = parseInt((req.query["limitPart"] as string) ?? "-1");
  try {
    for (const file of files) {
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
    log.error({ err: e }, "Album upload failed");
    fail(res, `${e}`);
  }
}

// POST /api/videos/:videoId/chapters
export async function handleVideoChapters(req, res) {
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
    log.error({ err: e }, "Video chapters failed");
    fail(res, `${e}`);
  }
}

// GET /api/part/:id/:fileName
export async function handleGetPart(req, res) {
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

  for (const hosting of song.hostingList) {
    try {
      log.info(`Get part ${req.params.fileName} from ${hosting.name}`);
      const provider = getPartProvider(hosting, {});
      const part = await provider.fetchRawPart(req.params.fileName);
      const headers: Record<string, string> = {};
      if (part.contentType) headers["Content-Type"] = part.contentType;
      if (part.contentLength != null) headers["Content-Length"] = String(part.contentLength);
      res?.writeHead(206, "Partial Content", headers);
      log.info("Part ok, streaming");
      part.data.pipe(res);
      return;
    } catch (e: any) {
      log.warn({ err: e }, `Fail to load from hosting ${hosting.name}`);
    }
  }
  fail(res, "No part available");
}

function getPartSizeForHosting(hosting: IHosting): number {
  if (hosting.stream.type === StreamStrategy.HTTP) {
    return (hosting.stream as IHttpStreamConfig).partSize;
  }
  if (hosting.upload.type === UploadStrategy.FTP) {
    return hosting.upload.ftpLimit;
  }
  return PARTSIZE;
}

async function backupSong(
  provider: StreamProvider,
  song: StreamInfo,
  targetHosting: IHosting
): Promise<void> {
  log.info(`Backup+ Song ${song.id} into hosting ${targetHosting.name}`);
  for (let i = 0; i < song.fileCount; i++) {
    const fileName = `${song.id}${i > 0 ? `_${i}` : ""}.${song.fileExtension}`;
    const buffers: Buffer[] = [];
    const outputStream = new Writable({
      write(chunk, _encoding, callback) {
        buffers.push(chunk);
        callback();
      }
    });
    const part = await provider.fetchRawPart(fileName);
    part.data.pipe(outputStream);
    await waitStreamClose(outputStream);

    log.info("Start uploading");

    const [fname, fext] = fileName.split(".");
    const uploader = getMediaUploader(targetHosting.upload);
    await uploader.init(targetHosting.upload);
    await uploader.upload(Buffer.concat(buffers), fname, fext);
    await uploader.end();
  }

  log.info(`Backup- Song ${song.id} completed`);
}

// POST /api/album/:id/backup/:hostid
export async function handleAlbumBackup(req, res) {
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

    for (const song of album.trackList as WithDocument<ISong>[]) {
      for (const hosting of song.hostingList) {
        const stream = getPartProvider(hosting, req.headers);
        const partSize = getPartSizeForHosting(hosting);

        const notHosted =
          (song.hostingList as WithDocument<IHosting>[]).findIndex((h) =>
            h._id.equals(targetHosting._id)
          ) === -1;
        const targetPartSize = getPartSizeForHosting(targetHosting);
        if (notHosted && partSize <= targetPartSize) {
          try {
            await backupSong(stream, song as WithDocument<ISong>, targetHosting);
            song.hostingList.push(targetHosting);
            await song.save();
            break;
          } catch (e: any) {
            log.warn({ err: e }, `Backup! ERR: hosting ${e?.message}`);
            continue;
          }
        }
      }
    }
  } catch (e) {
    log.error({ err: e }, "Album backup error");
    fail(res, "done");
  }

  ok(res);
}

// POST /api/album/:id/backup2/:hostid
export async function handleAlbumBackup2(req, res) {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");

  const skipExist = req.query["skipExist"] != null;
  const skipPart = parseInt((req.query["skipPart"] as string) ?? "0");
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
    for (const song of songs) {
      const provider = getPartProvider(targetHosting, req.headers);

      const statusRes = await provider.fetchRawPart("status.php");
      const buffers: Buffer[] = [];
      for await (const chunk of statusRes.data) {
        buffers.push(chunk);
      }
      const availableParts = new Set(Buffer.concat(buffers).toString("utf-8").split(","));

      try {
        for (let i = skipPart; i < skipPart + limitPart && i < song.fileCount; i++) {
          if (req.closed) {
            throw Error("Client aborted");
          }
          const fileName = `${`${song.id}${i == 0 ? "" : `_${i}`}`}.${song.fileExtension}`;

          if (availableParts.has(fileName) && skipExist) {
            log.info(`Backup ${i}/${song.fileCount} ${fileName} SKIP`);
            continue;
          }

          log.info(`Backup ${i}/${song.fileCount} ${fileName}`);
          const resPayload = await provider.fetchRawPart(`sync.php?id=${song.id}&file=${fileName}`);
          const respBuffers: Buffer[] = [];
          for await (const chunk of resPayload.data) {
            respBuffers.push(chunk);
          }
          const resp = Buffer.concat(respBuffers).toString("utf-8");
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
        log.warn({ err: e }, `Backup (sync) ERR: hosting ${e?.message}`);
        continue;
      }
    }
    ok(res);
  } catch (e) {
    log.error({ err: e }, "Backup2 error");
    fail(res, "done");
  }
}
