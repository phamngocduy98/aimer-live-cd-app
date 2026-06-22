import { Song } from "../models/Song.js";
import { Video } from "../models/Video.js";
import { SongStream } from "../services/stream/SongStream.js";
import {
  addRadioQueueItem,
  advanceRadioStation,
  buildRadioState,
  findPublicStreamSlot,
  heartbeatRadioListener,
  pauseRadioStation,
  removeRadioListener,
  removeRadioQueueItem,
  resumeRadioStation,
  rewindRadioStation,
  sendInvalidRadioMedia,
  validateRadioMediaType
} from "../services/radioService.js";
import { fail } from "../utils/reqUtils.js";
import { createLogger } from "../utils/log.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { sendDirectStreamManifest } from "./stream.js";

const log = createLogger("Radio");

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

function sendFixtureStream(req, res): void {
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
        "Content-Type": "audio/wav",
        "Content-Length": chunk.length,
        "Content-Range": `bytes ${start}-${safeEnd}/${body.length}`,
        "Accept-Ranges": "bytes"
      });
      res.end(chunk);
      return;
    }
  }

  res.writeHead(200, {
    "Content-Type": "audio/wav",
    "Content-Length": body.length,
    "Accept-Ranges": "bytes"
  });
  res.end(body);
}

function sendSse(res: any, event: string, data: unknown): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export async function handleGetRadioState(req: AuthenticatedRequest, res) {
  res.json(await buildRadioState(new Date(), req.auth));
}

export async function handleRadioEvents(req: AuthenticatedRequest, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive"
  });

  let lastSlotId: string | null = null;
  const writeState = async () => {
    try {
      const state = await buildRadioState(new Date(), req.auth);
      const slotId = state.current?.slotId ?? null;
      sendSse(res, slotId !== lastSlotId ? "slot" : "sync", state);
      lastSlotId = slotId;
    } catch (error) {
      log.error({ err: error }, "Radio SSE state failed");
      sendSse(res, "error", { message: "Radio unavailable" });
    }
  };

  await writeState();
  const interval = setInterval(writeState, 10000);
  req.on("close", () => clearInterval(interval));
}

export async function handleAddRadioQueueItem(req: AuthenticatedRequest, res) {
  const mediaType = validateRadioMediaType(req.body?.mediaType);
  if (!mediaType) return sendInvalidRadioMedia(res);

  const mediaId = typeof req.body?.mediaId === "string" ? req.body.mediaId : "";
  const result = await addRadioQueueItem({
    mediaType,
    mediaId,
    requestedBy: req.auth?.user?._id,
    canBypassDailyLimit: Boolean(req.auth?.canAccessAdmin)
  });
  if (!result) return fail(res, "Media not found", 404);
  if ("limitReached" in result) return fail(res, "Daily radio request limit reached", 429);

  res.json({
    status: "success",
    message: "Added to radio",
    position: result.position
  });
}

export async function handleRadioListenerHeartbeat(req, res) {
  const clientId = typeof req.body?.clientId === "string" ? req.body.clientId : "";
  if (!clientId.trim()) return fail(res, "clientId is required", 400);
  res.json(await heartbeatRadioListener(clientId));
}

export async function handleRemoveRadioListener(req, res) {
  const clientId = typeof req.params?.clientId === "string" ? req.params.clientId : "";
  res.json(removeRadioListener(clientId));
}

export async function handleAdminRadioControl(req, res) {
  const action = req.body?.action;
  if (action === "pause") {
    await pauseRadioStation();
  } else if (action === "resume") {
    await resumeRadioStation();
  } else if (action === "next") {
    await advanceRadioStation();
  } else if (action === "previous") {
    const result = await rewindRadioStation();
    if (!result) return fail(res, "No previous radio slot available", 404);
  } else {
    return fail(res, "Invalid radio action", 400);
  }

  res.json(await buildRadioState(new Date(), req.auth));
}

export async function handleAdminDeleteRadioQueueItem(req, res) {
  const item = await removeRadioQueueItem(req.params.queueItemId);
  if (!item) return fail(res, "Radio queue item not found", 404);
  res.json({ status: "success" });
}

export async function handleRadioStream(req, res) {
  const slot = await findPublicStreamSlot(req.params.slotId);
  if (!slot) return fail(res, "Radio slot not available", 404);

  const media =
    slot.mediaType === "audio"
      ? await Song.findById(slot.mediaId).populate("hostingList").exec()
      : await Video.findById(slot.mediaId).populate("hostingList").exec();
  if (!media) return fail(res, "Radio media not found", 404);

  if (process.env.E2E_TEST_MODE === "true") {
    sendFixtureStream(req, res);
    return;
  }

  try {
    const stream = new SongStream(req.headers);
    const { stream: mediaStream, metadata } = await stream.stream(media as any);
    res.writeHead(metadata.status, metadata.statusMessage, metadata.headers);
    mediaStream.pipe(res);
    mediaStream.on("error", (error) => {
      log.error({ err: error }, "Radio stream error");
      res.destroy(error);
    });
  } catch (error) {
    log.error({ err: error }, "Radio stream failed");
    fail(res, (error as Error).message, (error as any).status || 404);
  }
}

export async function handleRadioDirectStreamManifest(req, res) {
  const slot = await findPublicStreamSlot(req.params.slotId);
  if (!slot) return fail(res, "Radio slot not available", 404);

  const media =
    slot.mediaType === "audio"
      ? await Song.findById(slot.mediaId).populate("hostingList").exec()
      : await Video.findById(slot.mediaId).populate("hostingList").exec();

  return sendDirectStreamManifest(res, media, slot.mediaType);
}
