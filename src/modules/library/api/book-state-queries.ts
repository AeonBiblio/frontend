import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import {
  recentLibraryItemSchema,
  userBookStatusOutSchema,
} from '@shared/api/core'
import type { RecentLibraryItem, UserBookStatusOut } from '@shared/api/core'
import { useSessionQuery } from '@shared/api/auth'
import { useApiClient } from '@shared/api/runtimeConfig/provider/provider'
import {
  db,
  recentLibraryItemToLocalBookState,
  userBookStatusOutToLocalBookState,
} from '@shared/lib/db'

import {
  libraryKeys,
  localBookStateToRecentItem,
  localBookStateToStatusOut,
} from './common'

async function saveRemoteBookStates(
  states: ReturnType<typeof userBookStatusOutToLocalBookState>[],
) {
  const statesWithLocal = await Promise.all(
    states.map(async (state) => ({
      remote: state,
      local: await db.bookStates.get(state.id),
    })),
  )
  const writableStates = statesWithLocal
    .filter(({ local }) => !local?.dirty)
    .map(({ remote }) => remote)

  if (writableStates.length > 0) {
    await db.bookStates.bulkPut(writableStates)
  }
}

export function useRecentBooksQuery({ enabled = true } = {}) {
  const client = useApiClient()
  const session = useSessionQuery()
  const userId = session.data?.id

  return useQuery<RecentLibraryItem[]>({
    queryKey: libraryKeys.recent,
    enabled: enabled && Boolean(userId),
    staleTime: 60 * 1000,
    queryFn: async ({ signal }) => {
      if (!userId) {
        return []
      }

      try {
        const response = await client.get('/library/recent', {
          params: { limit: 20 },
          signal,
        })
        const items = z.array(recentLibraryItemSchema).parse(response.data)
        const localStates = items.map((item) =>
          recentLibraryItemToLocalBookState(item, userId),
        )

        await saveRemoteBookStates(localStates)
      } catch (error) {
        const localStates = await db.bookStates
          .where('userId')
          .equals(userId)
          .reverse()
          .sortBy('updatedAt')

        if (localStates.length === 0) {
          throw error
        }
      }

      const states = await db.bookStates
        .where('userId')
        .equals(userId)
        .reverse()
        .sortBy('updatedAt')

      return Promise.all(states.slice(0, 20).map(localBookStateToRecentItem))
    },
  })
}

export function useBookStatusesQuery({ enabled = true } = {}) {
  const client = useApiClient()
  const session = useSessionQuery()
  const userId = session.data?.id

  return useQuery<UserBookStatusOut[]>({
    queryKey: libraryKeys.status,
    enabled: enabled && Boolean(userId),
    staleTime: 60 * 1000,
    queryFn: async ({ signal }) => {
      if (!userId) {
        return []
      }

      try {
        const response = await client.get('/library/status', { signal })
        const items = z.array(userBookStatusOutSchema).parse(response.data)

        await saveRemoteBookStates(items.map(userBookStatusOutToLocalBookState))
      } catch (error) {
        const localStates = await db.bookStates
          .where('userId')
          .equals(userId)
          .toArray()

        if (localStates.length === 0) {
          throw error
        }
      }

      const states = await db.bookStates
        .where('userId')
        .equals(userId)
        .toArray()

      return states.map(localBookStateToStatusOut)
    },
  })
}
