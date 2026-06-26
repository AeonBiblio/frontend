import axios from 'axios'
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'

import {
  clearTokenPair,
  getAccessToken,
  getRefreshToken,
  setTokenPair,
} from '@shared/api/auth/token-storage'
import { tokenPairSchema } from '@shared/api/core/schemas'

type HttpClientOpts = {
  baseURL: string
  withCredentials?: boolean
  refreshPath?: string
  onAuthFailed?: () => void
  onNetworkError?: (error: AxiosError) => void
}

export type RetryableAxiosRequestConfig = AxiosRequestConfig & {
  _retry?: boolean
  suppressAuthRedirect?: boolean
}

function isRefreshRequest(
  config: AxiosRequestConfig | undefined,
  path: string,
) {
  const url = config?.url

  return Boolean(url && (url === path || url.endsWith(path)))
}

function shouldSkipTokenRefresh(
  config: AxiosRequestConfig | undefined,
  refreshPath: string,
) {
  const url = config?.url ?? ''

  if (!url || isRefreshRequest(config, refreshPath)) {
    return true
  }

  return url.includes('/auth/login') || url.includes('/auth/register')
}

export function isCanceledRequest(error: unknown) {
  return (
    axios.isCancel(error) ||
    (axios.isAxiosError(error) && error.code === 'ERR_CANCELED')
  )
}

export function isNetworkError(error: unknown) {
  return (
    axios.isAxiosError(error) && !error.response && !isCanceledRequest(error)
  )
}

export function createHttpClient(opts: HttpClientOpts): AxiosInstance {
  const client = axios.create({
    baseURL: opts.baseURL,
    withCredentials: opts.withCredentials ?? true,
  })

  client.interceptors.request.use((config) => {
    const token = getAccessToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  })

  let isRefreshing = false
  let queue: Array<(ok: boolean) => void> = []
  const flush = (ok: boolean) => {
    queue.forEach((r) => r(ok))
    queue = []
  }

  client.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
      const status = error.response?.status
      const original = error.config as RetryableAxiosRequestConfig | undefined

      if (!error.response) {
        opts.onNetworkError?.(error)
        throw error
      }

      const canRefresh =
        status === 401 &&
        opts.refreshPath &&
        original &&
        !original._retry &&
        !shouldSkipTokenRefresh(original, opts.refreshPath)

      if (canRefresh) {
        original._retry = true

        if (isRefreshing) {
          const gate = new Promise<boolean>((r) => queue.push(r))
          const ok = await gate

          if (!ok) throw error

          return client.request(original)
        }

        isRefreshing = true

        try {
          const refreshToken = getRefreshToken()

          if (!refreshToken) {
            throw error
          }

          const response = await axios.post(
            `${opts.baseURL}${opts.refreshPath}`,
            { refresh_token: refreshToken },
            {
              withCredentials: opts.withCredentials ?? true,
            },
          )
          const tokens = tokenPairSchema.parse(response.data)

          setTokenPair(tokens)
          original.headers = {
            ...original.headers,
            Authorization: `Bearer ${tokens.access_token}`,
          }
          flush(true)

          return client.request(original)
        } catch (e) {
          clearTokenPair()
          flush(false)
          if (!original.suppressAuthRedirect) {
            opts.onAuthFailed?.()
          }
          throw e
        } finally {
          isRefreshing = false
        }
      }
      throw error
    },
  )

  return client
}

export const apiClient = createHttpClient({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
  refreshPath: '/auth/refresh',
})
