import type { Song, Video } from "@features/library";

export type RadioMediaType = "audio" | "video";
export type RadioSource = "queue" | "random";
export type RadioMedia = Song | Video;

export interface RadioRequester {
  _id: string;
  username: string;
  displayName: string;
}

export interface RadioHistoryItem {
  slotId: string;
  mediaType: RadioMediaType;
  media: RadioMedia;
  source: RadioSource;
  startedAt: string;
  duration: number;
  requestedBy?: string;
  requestedByUser?: RadioRequester;
}

export interface CurrentRadioItem extends RadioHistoryItem {
  position: number;
  streamUrl: string;
}

export interface RadioUpcomingItem {
  queueItemId: string;
  mediaType: RadioMediaType;
  media: RadioMedia;
  requestedAt: string;
  requestedBy?: string;
  requestedByUser?: RadioRequester;
  position: number;
}

export interface RadioState {
  serverTime: string;
  current: CurrentRadioItem | null;
  history: RadioHistoryItem[];
  listenerCount: number;
  stationStatus: {
    paused: boolean;
    pausedAt?: string;
  };
  upcoming?: RadioUpcomingItem[];
}
