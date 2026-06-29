import axios from 'axios'
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'

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
          await axios.post(
            `${opts.baseURL}${opts.refreshPath}`,
            {},
            {
              withCredentials: opts.withCredentials ?? true,
            },
          )
          flush(true)

          return client.request(original)
        } catch (e) {
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

const apiBaseURL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:8000'

export const apiClient = createHttpClient({
  baseURL: apiBaseURL,
  withCredentials: true,
  refreshPath: '/auth/refresh',
})
