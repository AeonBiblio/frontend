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
import type { LocalReadlist, LocalReadlistItem } from '@shared/lib/db'

import {
  libraryKeys,
  localReadlistItemToOut,
  localReadlistToOut,
} from './common'

async function saveRemoteReadlists(readlists: ReadlistOut[]) {
  const localReadlists = await Promise.all(
    readlists.map(async (readlist) => ({
      remote: readlist,
      local: await db.readlists.get(readlist.id),
    })),
  )
  const writableReadlists = localReadlists
    .filter(({ local }) => !local?.dirty)
    .map(({ remote }) => readlistOutToLocalReadlist(remote))

  if (writableReadlists.length > 0) {
    await db.readlists.bulkPut(writableReadlists)
  }
}

async function saveRemoteReadlistItems(items: ReadlistItemOut[]) {
  const localItems = await Promise.all(
    items.map(async (item) => ({
      remote: item,
      local: await db.readlistItems.get(item.id),
    })),
  )
  const writableItems = localItems
    .filter(({ local }) => !local?.dirty)
    .map(({ remote }) => readlistItemOutToLocalReadlistItem(remote))

  if (writableItems.length > 0) {
    await db.readlistItems.bulkPut(writableItems)
  }
}

function isVisibleReadlist(readlist: LocalReadlist) {
  return !readlist.deletedAt
}

function isVisibleReadlistItem(item: LocalReadlistItem) {
  return !item.deletedAt
}

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

        await saveRemoteReadlists(readlists)
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
        .filter(isVisibleReadlist)
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

        await saveRemoteReadlistItems(items)
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
        .filter(isVisibleReadlistItem)
        .toArray()

      return localItems.map(localReadlistItemToOut)
    },
  })
}
