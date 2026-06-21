import { Song } from "../models/Song.js";
import { Video } from "../models/Video.js";
import { SongStream } from "../services/stream/SongStream.js";
import { fail } from "../utils/reqUtils.js";
import { createLogger } from "../utils/log.js";
import { PARTSIZE } from "../config/const.js";
import { contentType } from "../services/stream/content-type.js";
import { HostingProvider, IHosting, IHttpStreamConfig, StreamStrategy } from "../models/Hosting.js";
import { byPassHosting } from "../services/stream/part-provider/http-stream/bypass/bypass.js";

const log = createLogger("Stream");

function createSilentWav(durationSeconds = 30): Buffer {
  const sampleRate = 8000;
  const channels = 1;
  const bitsPerSample = 16;
  const dataSize = sampleRate * durationSeconds * channels * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28);
  buffer.writeUInt16LE(channels * (bitsPerSample / 8), 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

function sendFixtureStream(req, res, contentType: string): void {
  const body = createSilentWav();
  const range = req.headers.range;

  if (typeof range === "string") {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (match) {
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Number(match[2]) : body.length - 1;
      const safeEnd = Math.min(end, body.length - 1);
      const chunk = body.subarray(start, safeEnd + 1);
      res.writeHead(206, {
        "Content-Type": contentType,
        "Content-Length": chunk.length,
        "Content-Range": `bytes ${start}-${safeEnd}/${body.length}`,
        "Accept-Ranges": "bytes"
      });
      res.end(chunk);
      return;
    }
  }

  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": body.length,
    "Accept-Ranges": "bytes"
  });
  res.end(body);
}

// GET /api/stream/:id
export function handleDeprecatedStream(_req, res) {
  fail(res, "Deprecated api", 404);
}

// GET /api/stream/audio/:id
export async function handleStreamAudio(req, res) {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");
  const song = await Song.findById(req.params.id).populate("hostingList").exec();

  if (song == null) {
    return fail(res, "Song not found", 404);
  }

  if (process.env.E2E_TEST_MODE === "true") {
    sendFixtureStream(req, res, "audio/wav");
    return;
  }

  const errorMessages: string[] = [];
  let status: number = 404;
  try {
    const stream = new SongStream(req.headers);
    const { stream: audioStream, metadata } = await stream.stream(song);
    res.writeHead(metadata.status, metadata.statusMessage, metadata.headers);
    audioStream.pipe(res);
    audioStream.on("error", (e) => {
      log.error({ err: e }, "Stream error");
      res.destroy(e);
    });
    return;
  } catch (e) {
    status = (e as any).status || 404;
    errorMessages.push((e as Error).message);
  }

  fail(res, errorMessages.join(". "), status);
}

function getPartSize(hosting: IHosting): number {
  if (hosting.stream.type === StreamStrategy.HTTP) {
    return (hosting.stream as IHttpStreamConfig).partSize;
  }
  return PARTSIZE;
}

function directHostUrl(hosting: IHosting): string | null {
  if (hosting.stream.type !== StreamStrategy.HTTP) return null;
  const stream = hosting.stream as IHttpStreamConfig;
  const path = stream.path.startsWith("/") ? stream.path : `/${stream.path}`;
  return `http://${stream.host}${path}`;
}

async function directHostRequestHeaders(
  hosting: IHosting
): Promise<Record<string, string> | undefined> {
  if (hosting.stream.type !== StreamStrategy.HTTP) return undefined;

  const stream = hosting.stream as IHttpStreamConfig;
  const provider = hosting.provider ?? stream.antiHotlink;
  if (provider !== HostingProvider.INFINITVE_FREE) return undefined;

  const token = await byPassHosting.refreshToken(`http://${stream.host}`);
  return { Cookie: `__test=${token}` };
}

function directPartFileNames(id: string, fileCount: number, fileExtension: string): string[] {
  return Array.from({ length: fileCount }, (_value, index) => {
    const suffix = index > 0 ? `_${index}` : "";
    return `${id}${suffix}.${fileExtension}`;
  });
}

async function handleDirectStreamManifest(req, res, mediaType: "audio" | "video") {
  if (req.params.id.length !== 12 && req.params.id.length !== 24) {
    return fail(res, "Invalid request");
  }

  const media =
    mediaType === "audio"
      ? await Song.findById(req.params.id).populate("hostingList").exec()
      : await Video.findById(req.params.id).populate("hostingList").exec();

  if (media == null) {
    return fail(res, mediaType === "audio" ? "Song not found" : "Video not found", 404);
  }

  const key = process.env.AES_PW;
  if (!key) {
    return fail(res, "Direct streaming key is not configured", 500);
  }

  const hostingList = (
    await Promise.all(
      (media.hostingList ?? []).map(async (hosting) => {
        const stream = hosting.stream as IHttpStreamConfig;
        const urlBase = directHostUrl(hosting);
        if (!urlBase) return null;

        return {
          id: (hosting as any)._id?.toString?.() ?? hosting.name,
          name: hosting.name,
          provider: hosting.provider ?? stream.antiHotlink,
          urlBase,
          requestHeaders: await directHostRequestHeaders(hosting)
        };
      })
    )
  ).filter((hosting): hosting is NonNullable<typeof hosting> => Boolean(hosting));

  if (hostingList.length === 0) {
    return fail(res, "No direct HTTP hosting available", 404);
  }

  const partSize = Math.min(
    PARTSIZE,
    media.hostingList.length > 0 ? getPartSize(media.hostingList[0]) : PARTSIZE
  );
  const id = String((media as any)._id);

  res.json({
    id,
    mediaType,
    key,
    iv: media.iv,
    size: media.size,
    fileCount: media.fileCount,
    fileExtension: media.fileExtension,
    format: media.format,
    partSize,
    contentType: contentType.getContentType(media.fileExtension ?? media.format),
    files: directPartFileNames(id, media.fileCount, media.fileExtension),
    hosts: hostingList
  });
}

// GET /api/stream/direct/audio/:id
export async function handleDirectStreamAudioManifest(req, res) {
  return handleDirectStreamManifest(req, res, "audio");
}

// GET /api/stream/direct/video/:id
export async function handleDirectStreamVideoManifest(req, res) {
  return handleDirectStreamManifest(req, res, "video");
}

// GET /api/stream/video/:id
export async function handleStreamVideo(req, res) {
  if (req.params.id.length !== 12 && req.params.id.length !== 24)
    return fail(res, "Invalid request");
  const video = await Video.findById(req.params.id).populate("hostingList").exec();

  if (video == null) {
    return fail(res, "Video not found", 404);
  }

  if (process.env.E2E_TEST_MODE === "true") {
    sendFixtureStream(req, res, "audio/wav");
    return;
  }

  const errorMessages: string[] = [];
  let status: number = 404;
  try {
    const stream = new SongStream(req.headers);

    req.on("error", (e) => {
      log.error({ err: e }, "Client request error");
      res.end();
    });

    const { stream: videoStream, metadata } = await stream.stream(video);
    res.writeHead(metadata.status, metadata.statusMessage, metadata.headers);
    videoStream.pipe(res);
    videoStream.on("error", (e) => {
      log.error({ err: e }, "Stream error");
      res.destroy(e);
    });
    return;
  } catch (e) {
    status = (e as any).status || 404;
    errorMessages.push((e as Error).message);
  }

  fail(res, errorMessages.join(". "), status);
}
