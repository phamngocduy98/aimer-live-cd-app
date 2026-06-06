import { apiClient } from "@lib/axios"
import type { SearchResult } from "@renderer/types/shared"

export const search = async (query: string): Promise<SearchResult> =>
  (await apiClient.get<SearchResult>("/search", { params: { q: query } })).data
