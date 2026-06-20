import type { Song, Video } from "@features/library";
import { useMediaBackgroundColor } from "@utils/mediaBackground";

export function useAlbumBackgroundColor(media?: Song | Video | null): string {
  return useMediaBackgroundColor(media);
}
