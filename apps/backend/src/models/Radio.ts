import { model, mongo, Schema } from "mongoose";

export type RadioMediaType = "audio" | "video";
export type RadioQueueStatus = "pending" | "played" | "removed";
export type RadioSlotSource = "queue" | "random";

export interface IRadioQueueItem {
  mediaType: RadioMediaType;
  mediaId: typeof mongo.ObjectId;
  requestedBy?: typeof mongo.ObjectId;
  requestedAt: Date;
  status: RadioQueueStatus;
  playedAt?: Date;
}

export interface IRadioPlaybackSlot {
  mediaType: RadioMediaType;
  mediaId: typeof mongo.ObjectId;
  queueItemId?: typeof mongo.ObjectId;
  source: RadioSlotSource;
  startedAt: Date;
  duration: number;
}

export interface IRadioStationState {
  key: string;
  pausedAt?: Date;
}

export const radioQueueItemSchema = new Schema<IRadioQueueItem>(
  {
    mediaType: {
      type: String,
      enum: ["audio", "video"],
      required: true
    },
    mediaId: {
      type: mongo.ObjectId,
      required: true
    },
    requestedBy: {
      type: mongo.ObjectId,
      ref: "User"
    },
    requestedAt: {
      type: Date,
      default: () => new Date(),
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "played", "removed"],
      default: "pending",
      required: true
    },
    playedAt: Date
  },
  { timestamps: true }
);

export const radioPlaybackSlotSchema = new Schema<IRadioPlaybackSlot>(
  {
    mediaType: {
      type: String,
      enum: ["audio", "video"],
      required: true
    },
    mediaId: {
      type: mongo.ObjectId,
      required: true
    },
    queueItemId: {
      type: mongo.ObjectId,
      ref: "RadioQueueItem"
    },
    source: {
      type: String,
      enum: ["queue", "random"],
      required: true
    },
    startedAt: {
      type: Date,
      required: true
    },
    duration: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { timestamps: true }
);

export const radioStationStateSchema = new Schema<IRadioStationState>(
  {
    key: {
      type: String,
      required: true,
      unique: true
    },
    pausedAt: Date
  },
  { timestamps: true }
);

radioQueueItemSchema.index({ status: 1, requestedAt: 1 });
radioQueueItemSchema.index({ requestedBy: 1, requestedAt: 1 });
radioPlaybackSlotSchema.index({ startedAt: -1 });

export const RadioQueueItem = model<IRadioQueueItem>(
  "RadioQueueItem",
  radioQueueItemSchema,
  "radioQueueItems"
);

export const RadioPlaybackSlot = model<IRadioPlaybackSlot>(
  "RadioPlaybackSlot",
  radioPlaybackSlotSchema,
  "radioPlaybackSlots"
);

export const RadioStationState = model<IRadioStationState>(
  "RadioStationState",
  radioStationStateSchema,
  "radioStationState"
);
