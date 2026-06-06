import type { SelectChangeEvent } from "@mui/material/Select"

export interface Host {
  _id: string
  name: string
  provider: string
  path?: string
}

export interface ListFilesResult {
  available: boolean
  files: { fileName: string; parts: string; title: string; fileCount: number }[]
  status?: number
}

export interface NewHostState {
  host: string
  provider: string
  path: string
  ftpHost: string
  ftpPort: number
  ftpUsername: string
  ftpPassword: string
  ftpRoot: string
}

export type NewHostChangeHandler = (
  field: string
) => (
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
) => void
