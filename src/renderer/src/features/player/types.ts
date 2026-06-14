import { isVideo, type Song, type Video } from "@features/library/types";

export type MediaItem = Song | Video;

export type PlaySourceType =
  | "album"
  | "playlist"
  | "artist"
  | "search"
  | "songs"
  | "videos"
  | "video"
  | "home";

export interface PlaySource {
  type: PlaySourceType;
  id?: string;
  label: string;
  route: string;
}

export interface QueueEntry {
  queueEntryId: string;
  media: MediaItem;
  playFrom: PlaySource;
  sourceItemKey: string;
}

export interface PlayContextPayload {
  items: MediaItem[];
  playFrom: PlaySource;
  startIndex?: number;
  shuffle?: boolean;
  sourceItemKeys?: string[];
}

export const mediaType = (media: MediaItem): "audio" | "video" =>
  isVideo(media) ? "video" : "audio";

export const mediaSourcePath = (media: MediaItem): string =>
  isVideo(media) && media.youtubeUrl
    ? media.youtubeUrl
    : `/stream/${isVideo(media) ? "video" : "audio"}/${media._id}`;

export const sourceItemKey = (source: PlaySource, media: MediaItem, index: number): string =>
  `${source.type}:${source.id ?? source.route}:${mediaType(media)}:${media._id}:${index}`;

export const isCurrentSourceItem = (
  entry: QueueEntry | null,
  source: PlaySource,
  media: MediaItem,
  key?: string
): boolean =>
  Boolean(
    entry &&
      entry.media._id === media._id &&
      mediaType(entry.media) === mediaType(media) &&
      entry.playFrom.type === source.type &&
      entry.playFrom.id === source.id &&
      (!key || entry.sourceItemKey === key)
  );
