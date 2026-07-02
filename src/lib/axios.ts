import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios'

import {
  clearSessionState,
  getAccessToken,
  getSessionVersion,
  setAccessToken,
} from '@/features/auth/lib/authSession'
import type { RefreshResponse } from '@/types/api.types'

const API_BASE_URL = '/api'
const API_TIMEOUT_MS = 10_000
const AUTH_EXCLUDED_PATHS = new Set(['/auth/login', '/auth/refresh', '/auth/logout'])

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
})

let refreshPromise: Promise<string> | null = null

function setAuthorizationHeader(config: InternalAxiosRequestConfig, token: string) {
  const headers = AxiosHeaders.from(config.headers)
  headers.set('Authorization', `Bearer ${token}`)
  config.headers = headers
}

function shouldSkipRefresh(url?: string) {
  if (!url) {
    return false
  }

  return Array.from(AUTH_EXCLUDED_PATHS).some((path) => url.endsWith(path))
}

async function requestNewAccessToken() {
  const versionAtStart = getSessionVersion()

  try {
    const { data } = await refreshClient.post<RefreshResponse>('/auth/refresh')

    if (getSessionVersion() !== versionAtStart) {
      throw new Error('Session changed while refreshing token.')
    }

    setAccessToken(data.token)

    return data.token
  } finally {
    refreshPromise = null
  }
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = requestNewAccessToken()
  }

  return refreshPromise
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()

  if (token) {
    setAuthorizationHeader(config, token)
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry || shouldSkipRefresh(originalRequest.url)) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      const token = await refreshAccessToken()
      setAuthorizationHeader(originalRequest, token)

      return apiClient(originalRequest)
    } catch (refreshError) {
      clearSessionState()
      return Promise.reject(refreshError)
    }
  },
)
