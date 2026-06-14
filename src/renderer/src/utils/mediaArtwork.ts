import type { Song, Video } from "@features/library";
import { isVideo } from "@features/library";
import { apiAssetUrl } from "@lib/axios";

export function mediaArtworkUrl(media: Song | Video | null | undefined): string | undefined {
  if (!media) return undefined;
  if (isVideo(media)) return apiAssetUrl(`/video/${media._id}/cover`);
  return media.album?._id ? apiAssetUrl(`/album/${media.album._id}/cover`) : undefined;
}
