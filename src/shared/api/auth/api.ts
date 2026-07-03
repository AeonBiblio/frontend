import type { AxiosInstance } from 'axios'

import type { LocalSession } from '@shared/lib/db'

import { isNetworkError } from '../client/api-client'
import type { RetryableAxiosRequestConfig } from '../client/api-client'
import type { LoginDto, RegisterDto, SessionUser } from './dto'

const CURRENT_SESSION_KEY = 'current' as const
const ME_PATH = '/users/me'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function getLocalDb() {
  return import('@shared/lib/db')
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
  const pendingProfileUpdate = await db.outbox
    .where('entityId')
    .equals(user.id)
    .filter(
      (item) =>
        item.type === 'http.request' &&
        item.payload.method === 'patch' &&
        item.payload.path === ME_PATH &&
        item.status !== 'failed',
    )
    .last()
  const pendingBody =
    pendingProfileUpdate?.type === 'http.request' &&
    isRecord(pendingProfileUpdate.payload.body)
      ? pendingProfileUpdate.payload.body
      : undefined
  const nextUser: SessionUser =
    pendingBody
      ? {
          ...user,
          ...(typeof pendingBody.username === 'string'
            ? { username: pendingBody.username }
            : {}),
          ...(typeof pendingBody.display_tag === 'string'
            ? { displayTag: pendingBody.display_tag }
            : {}),
        }
      : user
  const session: LocalSession = {
    key: CURRENT_SESSION_KEY,
    userId: nextUser.id,
    updatedAt: Date.now(),
  }

  await db.transaction('rw', db.userProfiles, db.session, async () => {
    await db.userProfiles.put(nextUser)
    await db.session.put(session)
  })

  return (await db.userProfiles.get(nextUser.id)) ?? nextUser
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
    const user = await parseUser(response.data)

    return setSessionUser(user)
  },

  register: async (vars: RegisterDto) => {
    const response = await client.post('/auth/register', vars)
    const user = await parseUser(response.data)

    return setSessionUser(user)
  },

  logout: async () => {
    const response = await client.post('/auth/logout')

    await clearSessionUser()

    return response.data
  },
})
