import { Types } from "mongoose";
import { Song } from "../models/Song.js";
import { Video } from "../models/Video.js";
import {
  RadioPlaybackSlot,
  RadioQueueItem,
  RadioStationState,
  type IRadioPlaybackSlot,
  type RadioMediaType
} from "../models/Radio.js";
import { fail } from "../utils/reqUtils.js";
import { nextRadioStartTime, radioPosition, isRadioSlotExpired } from "../routes/radioLogic.js";
import type { SessionState } from "./authService.js";

const recentStreamGraceMs = 2 * 60 * 1000;
const dailyRadioRequestLimit = 5;
const listenerTtlMs = 30_000;
const stationKey = "global";

const listeners = new Map<string, number>();
let currentSlotRefresh: Promise<HydratedRadioSlot | null> | null = null;

interface HydratedRadioSlot {
  slot: IRadioPlaybackSlot & { _id: unknown };
  media: any;
}

function serializeRequester(requestedBy: unknown) {
  if (!requestedBy) return undefined;
  if (typeof requestedBy === "object" && "_id" in requestedBy) {
    const user = requestedBy as { _id: unknown; username?: string; displayName?: string };
    return {
      _id: String(user._id),
      username: user.username ?? "",
      displayName: user.displayName ?? user.username ?? ""
    };
  }
  return { _id: String(requestedBy), username: "", displayName: "" };
}

function requesterId(requestedBy: unknown): string | undefined {
  if (!requestedBy) return undefined;
  if (typeof requestedBy === "object" && "_id" in requestedBy) {
    return String((requestedBy as { _id: unknown })._id);
  }
  return String(requestedBy);
}

function mediaProjection(mediaType: RadioMediaType) {
  return mediaType === "audio" ? { iv: 0, hostingList: 0 } : { cover: 0, iv: 0, hostingList: 0 };
}

async function findMedia(mediaType: RadioMediaType, mediaId: unknown): Promise<any | null> {
  if (mediaType === "audio") {
    return Song.findById(mediaId, mediaProjection(mediaType))
      .populate("album", { title: 1, artist: 1 })
      .lean()
      .exec();
  }
  return Video.findById(mediaId, mediaProjection(mediaType)).lean().exec();
}

async function mediaExists(mediaType: RadioMediaType, mediaId: string): Promise<any | null> {
  if (!Types.ObjectId.isValid(mediaId)) return null;
  return findMedia(mediaType, mediaId);
}

async function nextQueuedMedia() {
  const item = await RadioQueueItem.findOne({ status: "pending" })
    .sort({ requestedAt: 1, _id: 1 })
    .exec();
  if (!item) return null;

  const media = await findMedia(item.mediaType, item.mediaId);
  if (!media || !Number.isFinite(media.duration) || media.duration <= 0) {
    item.status = "removed";
    await item.save();
    return nextQueuedMedia();
  }

  return { item, media };
}

async function randomMedia(previous?: IRadioPlaybackSlot | null) {
  const [songCount, videoCount] = await Promise.all([
    Song.estimatedDocumentCount().exec(),
    Video.estimatedDocumentCount().exec()
  ]);
  const total = songCount + videoCount;
  if (total <= 0) return null;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const index = Math.floor(Math.random() * total);
    const mediaType: RadioMediaType = index < songCount ? "audio" : "video";
    const offset = mediaType === "audio" ? index : index - songCount;
    const [media] =
      mediaType === "audio"
        ? await Song.find({}, mediaProjection(mediaType))
            .populate("album", { title: 1, artist: 1 })
            .skip(offset)
            .limit(1)
            .lean()
            .exec()
        : await Video.find({}, mediaProjection(mediaType)).skip(offset).limit(1).lean().exec();

    if (!media || !Number.isFinite(media.duration) || media.duration <= 0) continue;
    const sameAsPrevious =
      previous &&
      previous.mediaType === mediaType &&
      String(previous.mediaId) === String(media._id) &&
      total > 1;
    if (!sameAsPrevious || attempt === 5) return { mediaType, media };
  }

  return null;
}

async function createNextSlot(previous: (IRadioPlaybackSlot & { _id: unknown }) | null, now: Date) {
  return createSlot(previous, now, false);
}

async function createSlot(
  previous: (IRadioPlaybackSlot & { _id: unknown }) | null,
  now: Date,
  forceNow: boolean
) {
  const queued = await nextQueuedMedia();
  if (queued) {
    const slot = await RadioPlaybackSlot.create({
      mediaType: queued.item.mediaType,
      mediaId: queued.item.mediaId,
      queueItemId: queued.item._id,
      source: "queue",
      startedAt: forceNow ? now : nextRadioStartTime(previous, now),
      duration: Math.max(1, Math.floor(queued.media.duration))
    });
    queued.item.status = "played";
    queued.item.playedAt = slot.startedAt;
    await queued.item.save();
    return { slot, media: queued.media };
  }

  const random = await randomMedia(previous);
  if (!random) return null;

  const slot = await RadioPlaybackSlot.create({
    mediaType: random.mediaType,
    mediaId: random.media._id,
    source: "random",
    startedAt: forceNow ? now : nextRadioStartTime(previous, now),
    duration: Math.max(1, Math.floor(random.media.duration))
  });
  return { slot, media: random.media };
}

async function getStationState() {
  return RadioStationState.findOneAndUpdate(
    { key: stationKey },
    { $setOnInsert: { key: stationKey } },
    { new: true, upsert: true }
  ).exec();
}

function purgeListeners(now = Date.now()): void {
  for (const [clientId, expiresAt] of listeners.entries()) {
    if (expiresAt <= now) listeners.delete(clientId);
  }
}

function listenerCount(): number {
  purgeListeners();
  return listeners.size;
}

function dayBounds(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function effectiveNow(now: Date, pausedAt?: Date): Date {
  return pausedAt && pausedAt < now ? pausedAt : now;
}

export async function getCurrentRadioSlot(now = new Date()): Promise<HydratedRadioSlot | null> {
  const current = await findCurrentRadioSlot(now);
  if (current.needsRefresh) {
    return refreshCurrentRadioSlot(now);
  }

  if (!current.slot) return null;
  const hydrated = await hydrateSlot(current.slot as any);
  if (hydrated) return hydrated;
  if (current.paused) return null;
  return refreshCurrentRadioSlot(now);
}

async function findCurrentRadioSlot(now: Date) {
  const station = await getStationState();
  const clockNow = effectiveNow(now, station.pausedAt);
  const slot = await RadioPlaybackSlot.findOne({}).sort({ startedAt: -1, _id: -1 }).exec();
  return {
    slot,
    paused: Boolean(station.pausedAt),
    needsRefresh: !station.pausedAt && (!slot || isRadioSlotExpired(slot, clockNow))
  };
}

async function refreshCurrentRadioSlot(now: Date): Promise<HydratedRadioSlot | null> {
  if (!currentSlotRefresh) {
    currentSlotRefresh = createCurrentRadioSlotIfNeeded(now).finally(() => {
      currentSlotRefresh = null;
    });
  }

  return currentSlotRefresh;
}

async function createCurrentRadioSlotIfNeeded(now: Date): Promise<HydratedRadioSlot | null> {
  const current = await findCurrentRadioSlot(now);
  if (current.paused) return current.slot ? hydrateSlot(current.slot as any) : null;
  if (current.slot && !current.needsRefresh) {
    const hydrated = await hydrateSlot(current.slot as any);
    if (hydrated) return hydrated;
  }

  const next = await createNextSlot(current.slot as any, now);
  return (next as HydratedRadioSlot | null) ?? null;
}

async function hydrateSlot(
  slot: IRadioPlaybackSlot & { _id: unknown }
): Promise<HydratedRadioSlot | null> {
  const media = await findMedia(slot.mediaType, slot.mediaId);
  if (!media) return null;
  return { slot, media };
}

async function buildUpcoming(session?: SessionState | null) {
  if (!session?.canAccessPaidMedia) return undefined;

  const pending = await RadioQueueItem.find({ status: "pending" })
    .sort({ requestedAt: 1, _id: 1 })
    .populate("requestedBy", "username displayName")
    .lean()
    .exec();
  const userId = session.user?._id ? String(session.user._id) : null;
  const visible = session.canAccessAdmin
    ? pending
    : pending.filter((item) => userId && requesterId(item.requestedBy) === userId);

  const rows = await Promise.all(
    visible.map(async (item) => {
      const media = await findMedia(item.mediaType, item.mediaId);
      if (!media) return null;
      return {
        queueItemId: String(item._id),
        mediaType: item.mediaType,
        media,
        requestedAt: item.requestedAt.toISOString(),
        requestedBy: requesterId(item.requestedBy),
        requestedByUser: serializeRequester(item.requestedBy),
        position:
          pending.findIndex((pendingItem) => String(pendingItem._id) === String(item._id)) + 1
      };
    })
  );

  return rows.filter(Boolean);
}

export async function buildRadioState(now = new Date(), session?: SessionState | null) {
  const station = await getStationState();
  const clockNow = effectiveNow(now, station.pausedAt);
  const current = await getCurrentRadioSlot(now);
  if (!current) {
    return {
      serverTime: now.toISOString(),
      current: null,
      history: [],
      listenerCount: listenerCount(),
      stationStatus: {
        paused: Boolean(station.pausedAt),
        pausedAt: station.pausedAt?.toISOString()
      },
      upcoming: await buildUpcoming(session)
    };
  }

  const historySlots = await RadioPlaybackSlot.find({ _id: { $ne: current.slot._id } })
    .sort({ startedAt: -1, _id: -1 })
    .limit(5)
    .lean()
    .exec();
  const history = (
    await Promise.all(
      historySlots.map(async (slot) => {
        const media = await findMedia(slot.mediaType, slot.mediaId);
        if (!media) return null;
        const queueItem = slot.queueItemId
          ? await RadioQueueItem.findById(slot.queueItemId)
              .populate("requestedBy", "username displayName")
              .lean()
              .exec()
          : null;
        return {
          slotId: String(slot._id),
          mediaType: slot.mediaType,
          media,
          source: slot.source,
          startedAt: slot.startedAt.toISOString(),
          duration: slot.duration,
          requestedBy: requesterId(queueItem?.requestedBy),
          requestedByUser: serializeRequester(queueItem?.requestedBy)
        };
      })
    )
  ).filter(Boolean);

  const streamUrl =
    current.slot.mediaType === "video" && current.media.youtubeUrl
      ? current.media.youtubeUrl
      : `/radio/stream/${current.slot._id}`;
  const currentQueueItem = current.slot.queueItemId
    ? await RadioQueueItem.findById(current.slot.queueItemId)
        .populate("requestedBy", "username displayName")
        .lean()
        .exec()
    : null;

  return {
    serverTime: now.toISOString(),
    current: {
      slotId: String(current.slot._id),
      mediaType: current.slot.mediaType,
      media: current.media,
      source: current.slot.source,
      startedAt: current.slot.startedAt.toISOString(),
      position: radioPosition(current.slot, clockNow),
      duration: current.slot.duration,
      streamUrl,
      requestedBy: requesterId(currentQueueItem?.requestedBy),
      requestedByUser: serializeRequester(currentQueueItem?.requestedBy)
    },
    history,
    listenerCount: listenerCount(),
    stationStatus: { paused: Boolean(station.pausedAt), pausedAt: station.pausedAt?.toISOString() },
    upcoming: await buildUpcoming(session)
  };
}

export async function addRadioQueueItem({
  mediaType,
  mediaId,
  requestedBy,
  canBypassDailyLimit = false
}: {
  mediaType: RadioMediaType;
  mediaId: string;
  requestedBy?: string;
  canBypassDailyLimit?: boolean;
}) {
  const media = await mediaExists(mediaType, mediaId);
  if (!media || !Number.isFinite(media.duration) || media.duration <= 0) {
    return null;
  }
  if (shouldApplyDailyRadioRequestLimit(requestedBy, canBypassDailyLimit)) {
    const { start, end } = dayBounds();
    const requestCount = await RadioQueueItem.countDocuments({
      requestedBy,
      requestedAt: { $gte: start, $lt: end }
    }).exec();
    if (requestCount >= dailyRadioRequestLimit) {
      return { limitReached: true as const };
    }
  }

  const item = await RadioQueueItem.create({
    mediaType,
    mediaId,
    requestedBy: requestedBy && Types.ObjectId.isValid(requestedBy) ? requestedBy : undefined,
    requestedAt: new Date(),
    status: "pending"
  });
  const position = await RadioQueueItem.countDocuments({
    status: "pending",
    requestedAt: { $lte: item.requestedAt }
  }).exec();

  return { item, position };
}

export function shouldApplyDailyRadioRequestLimit(
  requestedBy: string | undefined,
  canBypassDailyLimit: boolean
): boolean {
  return Boolean(requestedBy && Types.ObjectId.isValid(requestedBy) && !canBypassDailyLimit);
}

export async function heartbeatRadioListener(clientId: string) {
  const id = clientId.trim();
  if (!id) return { listenerCount: listenerCount() };
  listeners.set(id, Date.now() + listenerTtlMs);
  return { listenerCount: listenerCount() };
}

export function removeRadioListener(clientId: string) {
  listeners.delete(clientId.trim());
  return { listenerCount: listenerCount() };
}

export async function pauseRadioStation(now = new Date()) {
  const station = await getStationState();
  if (station.pausedAt) return;
  station.pausedAt = now;
  await station.save();
}

export async function resumeRadioStation(now = new Date()) {
  const station = await getStationState();
  if (!station.pausedAt) return;
  const pausedMs = now.getTime() - station.pausedAt.getTime();
  const slot = await RadioPlaybackSlot.findOne({}).sort({ startedAt: -1, _id: -1 }).exec();
  if (slot && pausedMs > 0) {
    slot.startedAt = new Date(slot.startedAt.getTime() + pausedMs);
    await slot.save();
  }
  station.pausedAt = undefined;
  await station.save();
}

export async function advanceRadioStation(now = new Date()) {
  await resumeRadioStation(now);
  const current = await RadioPlaybackSlot.findOne({}).sort({ startedAt: -1, _id: -1 }).exec();
  return createSlot(current as any, now, true);
}

export async function rewindRadioStation(now = new Date()) {
  await resumeRadioStation(now);
  const current = await RadioPlaybackSlot.findOne({}).sort({ startedAt: -1, _id: -1 }).exec();
  const previous = await RadioPlaybackSlot.find(current ? { _id: { $ne: current._id } } : {})
    .sort({ startedAt: -1, _id: -1 })
    .limit(1)
    .exec();
  const slotToReplay = previous[0];
  if (!slotToReplay) return null;
  const media = await findMedia(slotToReplay.mediaType, slotToReplay.mediaId);
  if (!media) return null;
  const slot = await RadioPlaybackSlot.create({
    mediaType: slotToReplay.mediaType,
    mediaId: slotToReplay.mediaId,
    source: slotToReplay.source,
    queueItemId: slotToReplay.queueItemId,
    startedAt: now,
    duration: slotToReplay.duration
  });
  return { slot, media };
}

export async function removeRadioQueueItem(queueItemId: string) {
  if (!Types.ObjectId.isValid(queueItemId)) return null;
  const item = await RadioQueueItem.findOne({ _id: queueItemId, status: "pending" }).exec();
  if (!item) return null;
  item.status = "removed";
  await item.save();
  return item;
}

export async function findPublicStreamSlot(slotId: string) {
  if (!Types.ObjectId.isValid(slotId)) return null;
  const now = new Date();
  const current = await getCurrentRadioSlot(now);
  const slot = await RadioPlaybackSlot.findById(slotId).exec();
  if (!slot) return null;

  const isCurrent = current && String(current.slot._id) === String(slot._id);
  const endedAt = slot.startedAt.getTime() + slot.duration * 1000;
  const inGrace = endedAt + recentStreamGraceMs >= now.getTime();
  if (!isCurrent && !inGrace) return null;

  return slot;
}

export function validateRadioMediaType(value: unknown): RadioMediaType | null {
  return value === "audio" || value === "video" ? value : null;
}

export function sendInvalidRadioMedia(res: any) {
  return fail(res, "mediaType must be audio or video", 400);
}
