import { useMutation, useQuery } from "@tanstack/react-query"
import { queryClient } from "@lib/queryClient"
import {
  createHost,
  deleteHost,
  listHostFiles,
  listHosts,
  type NewHostPayload
} from "../api/hosts"

export const hostsKeys = {
  all: ["hosts"] as const,
  files: (hostId: string) => ["hosts", hostId, "files"] as const
}

export const useHosts = () => useQuery({ queryKey: hostsKeys.all, queryFn: listHosts })

export const useHostFiles = (hostId: string) =>
  useQuery({
    queryKey: hostsKeys.files(hostId),
    queryFn: () => listHostFiles(hostId),
    enabled: Boolean(hostId)
  })

export const useDeleteHost = () =>
  useMutation({
    mutationFn: deleteHost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: hostsKeys.all })
  })

export const useCreateHost = () =>
  useMutation({
    mutationFn: (payload: NewHostPayload) => createHost(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: hostsKeys.all })
  })
