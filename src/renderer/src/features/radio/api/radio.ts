import { apiClient } from "@lib/axios";
import type { RadioMediaType, RadioState } from "../types";

export const getRadioState = async (): Promise<RadioState> =>
  (await apiClient.get<RadioState>("/radio/state")).data;

export const addToRadioQueue = async ({
  mediaType,
  mediaId
}: {
  mediaType: RadioMediaType;
  mediaId: string;
}): Promise<{ status: string; message: string; position: number }> =>
  (await apiClient.post("/radio/queue", { mediaType, mediaId })).data;

export const heartbeatRadioListener = async (
  clientId: string
): Promise<{ listenerCount: number }> =>
  (await apiClient.post("/radio/listeners/heartbeat", { clientId })).data;

export const removeRadioListener = async (clientId: string): Promise<{ listenerCount: number }> =>
  (await apiClient.delete(`/radio/listeners/${encodeURIComponent(clientId)}`)).data;
