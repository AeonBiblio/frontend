import type { TokenPair } from '@shared/api/core/schemas'

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

function getStorage() {
  if (typeof localStorage === 'undefined') {
    return null
  }

  return localStorage
}

export function getAccessToken() {
  return getStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null
}

export function getRefreshToken() {
  return getStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null
}

export function setTokenPair(tokens: TokenPair) {
  const storage = getStorage()

  if (!storage) {
    return
  }

  storage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
  storage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
}

export function clearTokenPair() {
  const storage = getStorage()

  if (!storage) {
    return
  }

  storage.removeItem(ACCESS_TOKEN_KEY)
  storage.removeItem(REFRESH_TOKEN_KEY)
}
