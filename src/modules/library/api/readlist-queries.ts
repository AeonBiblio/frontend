import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { readlistItemOutSchema, readlistOutSchema } from '@shared/api/core'
import type { ReadlistItemOut, ReadlistOut } from '@shared/api/core'
import { useSessionQuery } from '@shared/api/auth'
import { useApiClient } from '@shared/api/runtimeConfig/provider/provider'
import {
  db,
  readlistItemOutToLocalReadlistItem,
  readlistOutToLocalReadlist,
} from '@shared/lib/db'

import {
  libraryKeys,
  localReadlistItemToOut,
  localReadlistToOut,
} from './common'

export function useReadlistsQuery({ enabled = true } = {}) {
  const client = useApiClient()
  const session = useSessionQuery()
  const userId = session.data?.id

  return useQuery<ReadlistOut[]>({
    queryKey: libraryKeys.readlists,
    enabled: enabled && Boolean(userId),
    staleTime: 60 * 1000,
    queryFn: async ({ signal }) => {
      if (!userId) {
        return []
      }

      try {
        const response = await client.get('/library/readlists', { signal })
        const readlists = z.array(readlistOutSchema).parse(response.data)

        await db.readlists.bulkPut(readlists.map(readlistOutToLocalReadlist))
      } catch (error) {
        const localReadlists = await db.readlists
          .where('userId')
          .equals(userId)
          .toArray()

        if (localReadlists.length === 0) {
          throw error
        }
      }

      const localReadlists = await db.readlists
        .where('userId')
        .equals(userId)
        .filter((readlist) => !readlist.deletedAt)
        .toArray()

      return localReadlists.map(localReadlistToOut)
    },
  })
}

export function useReadlistBooksQuery(
  readlistId: string,
  { enabled = true } = {},
) {
  const client = useApiClient()

  return useQuery<ReadlistItemOut[]>({
    queryKey: libraryKeys.readlistBooks(readlistId),
    enabled: enabled && Boolean(readlistId),
    staleTime: 60 * 1000,
    queryFn: async ({ signal }) => {
      try {
        const response = await client.get(
          `/library/readlists/${readlistId}/books`,
          { signal },
        )
        const items = z.array(readlistItemOutSchema).parse(response.data)

        await db.readlistItems.bulkPut(
          items.map(readlistItemOutToLocalReadlistItem),
        )
      } catch (error) {
        const localItems = await db.readlistItems
          .where('readlistId')
          .equals(readlistId)
          .toArray()

        if (localItems.length === 0) {
          throw error
        }
      }

      const localItems = await db.readlistItems
        .where('readlistId')
        .equals(readlistId)
        .filter((item) => !item.deletedAt)
        .toArray()

      return localItems.map(localReadlistItemToOut)
    },
  })
}
