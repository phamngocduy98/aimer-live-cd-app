import { apiClient } from "@lib/axios"
import type { Host, ListFilesResult } from "../types"

export interface NewHostPayload {
  host: string
  provider: string
  path?: string
  ftpCredential: {
    host: string
    port?: number
    username: string
    password: string
    secure?: boolean
  }
  ftpRoot: string
}

export const listHosts = async (): Promise<Host[]> =>
  (await apiClient.get<Host[]>("/hosts")).data

export const deleteHost = async (id: string): Promise<void> => {
  await apiClient.delete(`/hosts/${id}`)
}

export const listHostFiles = async (hostId: string): Promise<ListFilesResult> =>
  (await apiClient.get<ListFilesResult>(`/hosts/${hostId}/files`)).data

export const createHost = async (data: NewHostPayload): Promise<string> =>
  (await apiClient.post<string>("/hosts", data)).data
