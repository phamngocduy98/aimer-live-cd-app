import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios"

export const apiClient = axios.create({ withCredentials: true })

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
