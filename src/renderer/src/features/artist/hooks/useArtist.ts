import { useQuery } from "@tanstack/react-query"
import { getArtist } from "../api/artist"

export const useArtist = (name: string) =>
  useQuery({
    queryKey: ["artist", name],
    queryFn: () => getArtist(name),
    enabled: Boolean(name)
  })
