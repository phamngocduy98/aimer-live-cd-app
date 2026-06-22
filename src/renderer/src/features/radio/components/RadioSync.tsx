import React from "react";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { playRadio } from "@features/player/store/playerSlice";
import { useRadioListenerHeartbeat, useRadioState } from "../hooks/useRadio";
import type { CurrentRadioItem, RadioState } from "../types";

export function radioPlaybackSyncKey(
  current: CurrentRadioItem | null,
  data: RadioState | undefined
): string | null {
  if (!current || !data) return null;
  return [
    current.slotId,
    current.mediaType,
    current.media._id,
    current.startedAt,
    current.duration,
    current.streamUrl,
    data.stationStatus.paused ? "paused" : "live"
  ].join(":");
}

export function RadioSync() {
  const dispatch = useAppDispatch();
  const radio = useAppSelector((state) => state.player.radio);
  const { data, refetch } = useRadioState();
  const current = data?.current ?? null;
  const appliedPlaybackKey = React.useRef<string | null>(null);
  useRadioListenerHeartbeat(radio.enabled && radio.listening);

  React.useEffect(() => {
    if (!radio.enabled || !radio.listening || !current || !data || data.stationStatus.paused) {
      return;
    }

    const serverElapsed = Date.now() - new Date(data.serverTime).getTime();
    const remainingMs = Math.max(0, (current.duration - current.position) * 1000 - serverElapsed);
    const timeout = window.setTimeout(() => {
      void refetch();
    }, remainingMs + 250);

    return () => window.clearTimeout(timeout);
  }, [current, data, radio.enabled, radio.listening, refetch]);

  React.useEffect(() => {
    if (!radio.enabled || !radio.listening || !current || !data) return;
    const playbackKey = radioPlaybackSyncKey(current, data);
    if (playbackKey === appliedPlaybackKey.current) return;
    appliedPlaybackKey.current = playbackKey;
    dispatch(
      playRadio({
        media: current.media,
        mediaType: current.mediaType,
        slotId: current.slotId,
        startedAt: current.startedAt,
        serverTime: data.serverTime,
        position: current.position,
        duration: current.duration,
        streamUrl: current.streamUrl,
        paused: data.stationStatus.paused,
        history: data.history
      })
    );
  }, [current, data, dispatch, radio.enabled, radio.listening]);

  return null;
}
