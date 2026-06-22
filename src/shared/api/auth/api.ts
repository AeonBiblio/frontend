import type { AxiosInstance } from 'axios'

import { db } from '@shared/lib/db'
import type { LocalSession } from '@shared/lib/db'

import { isNetworkError } from '../client/api-client'
import type { RetryableAxiosRequestConfig } from '../client/api-client'
import type { LoginDto, RegisterDto, SessionUser } from './dto'

const CURRENT_SESSION_KEY = 'current' as const
const ME_PATH = '/auth/me'

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
      const response = await client.get<SessionUser>(ME_PATH, config)

      await setSessionUser(response.data)

      return response.data
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

  login: async (vars: LoginDto) =>
    (await client.post('/auth/login', vars)).data,

  register: async (vars: RegisterDto) => {
    const response = await client.post<{
      message: string
      user: SessionUser
    }>('/auth/register', vars)

    await setSessionUser(response.data.user)

    return response.data
  },

  logout: async () => {
    const response = await client.post('/auth/logout')

    await clearSessionUser()

    return response.data
  },
})
