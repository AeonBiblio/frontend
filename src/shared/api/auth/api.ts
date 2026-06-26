import type { AxiosInstance } from 'axios'

import { db, userOutToLocalUserProfile } from '@shared/lib/db'
import type { LocalSession } from '@shared/lib/db'
import { tokenPairSchema, userOutSchema } from '@shared/api/core/schemas'

import { isNetworkError } from '../client/api-client'
import type { RetryableAxiosRequestConfig } from '../client/api-client'
import { clearTokenPair, getRefreshToken, setTokenPair } from './token-storage'
import type { LoginDto, RegisterDto, SessionUser } from './dto'

const CURRENT_SESSION_KEY = 'current' as const
const ME_PATH = '/users/me'

async function getCachedSessionUser() {
  const session = await db.session.get(CURRENT_SESSION_KEY)

  if (!session) {
    return null
  }

  return db.userProfiles.get(session.userId)
}

async function setSessionUser(user: SessionUser) {
  const session: LocalSession = {
    key: CURRENT_SESSION_KEY,
    userId: user.id,
    updatedAt: Date.now(),
  }

  await db.transaction('rw', db.userProfiles, db.session, async () => {
    await db.userProfiles.put(user)
    await db.session.put(session)
  })
}

async function clearSessionUser() {
  await db.session.delete(CURRENT_SESSION_KEY)
}

export const authApi = (client: AxiosInstance) => ({
  me: async (signal?: AbortSignal) => {
    try {
      const config: RetryableAxiosRequestConfig = {
        signal,
        suppressAuthRedirect: true,
      }
      const response = await client.get(ME_PATH, config)
      const user = userOutToLocalUserProfile(userOutSchema.parse(response.data))

      await setSessionUser(user)

      return user
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error
      }

      const cachedUser = await getCachedSessionUser()

      if (!cachedUser) {
        throw error
      }

      return cachedUser
    }
  },

  login: async (vars: LoginDto) => {
    const response = await client.post('/auth/login', vars)
    const tokens = tokenPairSchema.parse(response.data)

    setTokenPair(tokens)

    return tokens
  },

  register: async (vars: RegisterDto) => {
    const response = await client.post('/auth/register', vars)
    const user = userOutToLocalUserProfile(userOutSchema.parse(response.data))

    await setSessionUser(user)

    return user
  },

  logout: async () => {
    const refreshToken = getRefreshToken()
    const response = await client.post('/auth/logout', {
      refresh_token: refreshToken,
    })

    clearTokenPair()
    await clearSessionUser()

    return response.data
  },
})
