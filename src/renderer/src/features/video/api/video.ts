import { apiClient } from "@lib/axios";
import type { Video } from "@features/library";

export const getVideo = async (id: string): Promise<Video> =>
  (await apiClient.get<Video>(`/video/${id}`)).data;
