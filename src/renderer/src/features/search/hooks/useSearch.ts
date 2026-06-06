import { useQuery } from "@tanstack/react-query"
import { search } from "../api/search"

export const searchKeys = {
  query: (query: string) => ["search", query] as const
}

export const useSearch = (query: string) =>
  useQuery({
    queryKey: searchKeys.query(query),
    queryFn: () => search(query),
    enabled: Boolean(query)
  })
