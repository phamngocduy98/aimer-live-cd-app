import axios from "axios"

export const apiClient = axios.create()

export function configureApiBaseUrl(): void {
  if (window.electronAPI) {
    window.electronAPI.getPort().then((port) => {
      apiClient.defaults.baseURL = `http://localhost:${port}/api`
    })
  } else {
    apiClient.defaults.baseURL = "/api"
  }
}

export const apiAssetUrl = (path: string): string =>
  `${apiClient.defaults.baseURL ?? "/api"}${path}`
