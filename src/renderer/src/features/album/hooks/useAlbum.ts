import { useQuery } from "@tanstack/react-query"
import { getAlbum } from "../api/album"

export const albumDetailKey = (id: string) => ["album", id] as const

export const useAlbum = (id: string) =>
  useQuery({
    queryKey: albumDetailKey(id),
    queryFn: () => getAlbum(id),
    enabled: Boolean(id)
  })
