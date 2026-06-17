import { useAppDispatch, useAppSelector } from "@app/hooks";
import type { PlayContextPayload } from "@features/player/types";
import { playContext } from "@features/player/store/playerSlice";
import { isVideo, type Song, type Video } from "@features/library/types";
import { showSubscriptionPrompt } from "../store/authSlice";

type MediaItem = Song | Video;

interface PlaybackGateResult {
  payload?: PlayContextPayload;
  showPrompt: boolean;
}

export function isFreePlayableMedia(media: MediaItem): boolean {
  return isVideo(media) && Boolean(media.youtubeUrl);
}

export function filterPlayableMedia(items: MediaItem[], canAccessPaidMedia: boolean): MediaItem[] {
  return canAccessPaidMedia ? items : items.filter(isFreePlayableMedia);
}

export function preparePlaybackGatePayload(
  payload: PlayContextPayload,
  canAccessPaidMedia: boolean
): PlaybackGateResult {
  if (canAccessPaidMedia) return { payload, showPrompt: false };

  const selectedIndex = payload.startIndex ?? 0;
  const selectedItem = payload.items[selectedIndex];
  const hasExplicitSelection = payload.startIndex !== undefined;
  const sourceItemKeys = payload.sourceItemKeys;

  if (hasExplicitSelection && selectedItem && !isFreePlayableMedia(selectedItem)) {
    return { showPrompt: true };
  }

  const playableEntries = payload.items
    .map((item, index) => ({ item, originalIndex: index }))
    .filter(({ item }) => isFreePlayableMedia(item));

  if (playableEntries.length === 0) {
    return { showPrompt: true };
  }

  const startIndex =
    hasExplicitSelection && selectedItem
      ? playableEntries.findIndex(({ originalIndex }) => originalIndex === selectedIndex)
      : 0;

  return {
    payload: {
      ...payload,
      items: playableEntries.map(({ item }) => item),
      startIndex: Math.max(startIndex, 0),
      sourceItemKeys: sourceItemKeys
        ? playableEntries.map(({ originalIndex }) => sourceItemKeys[originalIndex])
        : undefined
    },
    showPrompt: !hasExplicitSelection && playableEntries.length !== payload.items.length
  };
}

export function usePlaybackGate() {
  const dispatch = useAppDispatch();
  const canAccessPaidMedia = useAppSelector((state) => state.auth.session.canAccessPaidMedia);

  return (payload: PlayContextPayload): void => {
    const result = preparePlaybackGatePayload(payload, canAccessPaidMedia);
    if (result.showPrompt) {
      dispatch(showSubscriptionPrompt());
    }
    if (result.payload) dispatch(playContext(result.payload));
  };
}
