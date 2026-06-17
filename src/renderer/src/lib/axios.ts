import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios"

export const apiClient = axios.create({ withCredentials: true })
let streamBaseUrl = import.meta.env.VITE_STREAM_BASE_URL || import.meta.env.VITE_API_BASE_URL || "/api"

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retryAfterRefresh?: boolean
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableRequestConfig | undefined
    const status = error.response?.status
    const url = config?.url ?? ""

    if (
      status === 401 &&
      config &&
      !config._retryAfterRefresh &&
      !url.includes("/auth/login") &&
      !url.includes("/auth/logout") &&
      !url.includes("/auth/refresh")
    ) {
      config._retryAfterRefresh = true
      await apiClient.post("/auth/refresh")
      return apiClient(config)
    }

    return Promise.reject(error)
  }
)

export async function configureApiBaseUrl(): Promise<void> {
  if (window.electronAPI) {
    const [apiBaseUrl, electronStreamBaseUrl] = await Promise.all([
      window.electronAPI.getApiBaseUrl(),
      window.electronAPI.getStreamBaseUrl()
    ])
    apiClient.defaults.baseURL = apiBaseUrl
    streamBaseUrl = electronStreamBaseUrl
    return
  }
  apiClient.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || "/api"
  streamBaseUrl = import.meta.env.VITE_STREAM_BASE_URL || apiClient.defaults.baseURL
}

export const apiAssetUrl = (path: string): string =>
  `${apiClient.defaults.baseURL ?? "/api"}${path}`

export const streamAssetUrl = (path: string): string => `${streamBaseUrl}${path}`
