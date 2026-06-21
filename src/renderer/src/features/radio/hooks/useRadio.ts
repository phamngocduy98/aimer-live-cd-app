import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiAssetUrl } from "@lib/axios";
import {
  addToRadioQueue,
  getRadioState,
  heartbeatRadioListener,
  removeRadioListener
} from "../api/radio";
import type { RadioState } from "../types";

export const radioKeys = {
  state: ["radio", "state"] as const
};

export function mergeRadioStateUpdate(
  current: RadioState | undefined,
  incoming: RadioState
): RadioState {
  if (incoming.upcoming === undefined && current?.upcoming !== undefined) {
    return { ...incoming, upcoming: current.upcoming };
  }

  return incoming;
}

export const useRadioState = ({ subscribe = true }: { subscribe?: boolean } = {}) => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: radioKeys.state,
    queryFn: getRadioState,
    refetchInterval: 30000
  });

  React.useEffect(() => {
    if (!subscribe) return;
    const source = new EventSource(apiAssetUrl("/radio/events"), { withCredentials: true });
    const sync = (event: MessageEvent<string>) => {
      const incoming = JSON.parse(event.data) as RadioState;
      queryClient.setQueryData<RadioState>(radioKeys.state, (current) =>
        mergeRadioStateUpdate(current, incoming)
      );
    };
    source.addEventListener("slot", sync);
    source.addEventListener("sync", sync);
    return () => source.close();
  }, [queryClient, subscribe]);

  return query;
};

export const useAddToRadio = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addToRadioQueue,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: radioKeys.state })
  });
};

export function useRadioListenerHeartbeat(active: boolean) {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!active) return;
    const storageKey = "radio-listener-client-id";
    const existing = window.localStorage.getItem(storageKey);
    const clientId = existing || window.crypto.randomUUID();
    if (!existing) window.localStorage.setItem(storageKey, clientId);

    const heartbeat = async () => {
      const result = await heartbeatRadioListener(clientId);
      queryClient.setQueryData<RadioState>(radioKeys.state, (current) =>
        current ? { ...current, listenerCount: result.listenerCount } : current
      );
    };

    void heartbeat();
    const interval = window.setInterval(() => void heartbeat(), 10_000);
    const cleanup = () => {
      window.clearInterval(interval);
      void removeRadioListener(clientId).then((result) => {
        queryClient.setQueryData<RadioState>(radioKeys.state, (current) =>
          current ? { ...current, listenerCount: result.listenerCount } : current
        );
      });
    };

    window.addEventListener("beforeunload", cleanup, { once: true });
    return () => {
      window.removeEventListener("beforeunload", cleanup);
      cleanup();
    };
  }, [active, queryClient]);
}
