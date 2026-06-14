import { useQuery } from "@tanstack/react-query";
import { getVideo } from "../api/video";

export const videoDetailKey = (id: string) => ["video", id] as const;

export const useVideo = (id: string) =>
  useQuery({
    queryKey: videoDetailKey(id),
    queryFn: () => getVideo(id),
    enabled: Boolean(id)
  });
