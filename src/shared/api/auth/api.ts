import type { AxiosInstance } from 'axios'

import type { LocalSession } from '@shared/lib/db'

import { isNetworkError } from '../client/api-client'
import type { RetryableAxiosRequestConfig } from '../client/api-client'
import { clearTokenPair, getRefreshToken, setTokenPair } from './token-storage'
import type { LoginDto, RegisterDto, SessionUser } from './dto'

const CURRENT_SESSION_KEY = 'current' as const
const ME_PATH = '/users/me'

async function getLocalDb() {
  return import('@shared/lib/db')
}

async function parseTokenPair(data: unknown) {
  const { tokenPairSchema } = await import('@shared/api/core/schemas')

  return tokenPairSchema.parse(data)
}

async function parseUser(data: unknown) {
  const [{ userOutSchema }, { userOutToLocalUserProfile }] = await Promise.all([
    import('@shared/api/core/schemas'),
    import('@shared/lib/db'),
  ])

  return userOutToLocalUserProfile(userOutSchema.parse(data))
}

async function getCachedSessionUser() {
  const { db } = await getLocalDb()
  const session = await db.session.get(CURRENT_SESSION_KEY)

  if (!session) {
    return null
  }

  return db.userProfiles.get(session.userId)
}

async function setSessionUser(user: SessionUser) {
  const { db } = await getLocalDb()
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
  const { db } = await getLocalDb()
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
      const user = await parseUser(response.data)

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
    const tokens = await parseTokenPair(response.data)

    setTokenPair(tokens)

    return tokens
  },

  register: async (vars: RegisterDto) => {
    const response = await client.post('/auth/register', vars)
    const user = await parseUser(response.data)

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
