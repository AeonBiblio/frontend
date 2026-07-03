import { useMutation, useQueryClient } from '@tanstack/react-query'

import type {
  CreateReadlistBody,
  ReadlistBookBody,
  ReadlistItemOut,
  ReadlistOut,
  UpdateReadlistBody,
} from '@shared/api/core'
import { useSessionQuery } from '@shared/api/auth'
import { db } from '@shared/lib/db'
import type { LocalReadlist, LocalReadlistItem } from '@shared/lib/db'
import {
  createOutboxItem,
  flushOutboxSoon,
} from '@modules/offline/model/enqueue-outbox-item'

import {
  libraryKeys,
  localReadlistItemToOut,
  localReadlistToOut,
} from './common'

function createId() {
  return globalThis.crypto.randomUUID()
}

export function useCreateReadlistMutation() {
  const queryClient = useQueryClient()
  const session = useSessionQuery({ enabled: true })

  return useMutation<ReadlistOut, Error, CreateReadlistBody>({
    mutationFn: async (body) => {
      const user = session.data

      if (!user) {
        throw new Error('Not authorized')
      }

      const now = new Date().toISOString()
      const readlist: LocalReadlist = {
        id: createId(),
        userId: user.id,
        title: body.title,
        description: body.description ?? null,
        isPublic: body.is_public,
        createdAt: now,
        updatedAt: now,
        dirty: true,
      }

      await db.transaction('rw', db.readlists, db.outbox, async () => {
        await db.readlists.put(readlist)
        await db.outbox.put(
          createOutboxItem({
            type: 'http.request',
            entityId: readlist.id,
            userId: user.id,
            payload: {
              method: 'post',
              path: '/library/readlists',
              body,
            },
          }),
        )
      })

      flushOutboxSoon()

      return localReadlistToOut(readlist)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: libraryKeys.readlists })
    },
  })
}

export function useUpdateReadlistMutation(readlistId: string) {
  const queryClient = useQueryClient()
  const session = useSessionQuery({ enabled: true })

  return useMutation<ReadlistOut, Error, UpdateReadlistBody>({
    mutationFn: async (body) => {
      const user = session.data
      let updatedReadlist!: LocalReadlist

      if (!user) {
        throw new Error('Not authorized')
      }

      await db.transaction('rw', db.readlists, db.outbox, async () => {
        const readlist = await db.readlists.get(readlistId)

        if (!readlist) {
          throw new Error('Collection is not available offline')
        }

        updatedReadlist = {
          ...readlist,
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.description !== undefined
            ? { description: body.description }
            : {}),
          ...(body.is_public !== undefined ? { isPublic: body.is_public } : {}),
          updatedAt: new Date().toISOString(),
          dirty: true,
        }

        await db.readlists.put(updatedReadlist)
        await db.outbox.put(
          createOutboxItem({
            type: 'http.request',
            entityId: readlistId,
            userId: user.id,
            payload: {
              method: 'patch',
              path: `/library/readlists/${readlistId}`,
              body,
            },
          }),
        )
      })

      flushOutboxSoon()

      return localReadlistToOut(updatedReadlist)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: libraryKeys.readlists })
    },
  })
}

export function useDeleteReadlistMutation() {
  const queryClient = useQueryClient()
  const session = useSessionQuery({ enabled: true })

  return useMutation<void, Error, string>({
    mutationFn: async (readlistId) => {
      const user = session.data

      if (!user) {
        throw new Error('Not authorized')
      }

      await db.transaction('rw', db.readlists, db.outbox, async () => {
        const readlist = await db.readlists.get(readlistId)

        if (!readlist) {
          throw new Error('Collection is not available offline')
        }

        await db.readlists.put({
          ...readlist,
          deletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dirty: true,
        })
        await db.outbox.put(
          createOutboxItem({
            type: 'http.request',
            entityId: readlistId,
            userId: user.id,
            payload: {
              method: 'delete',
              path: `/library/readlists/${readlistId}`,
            },
          }),
        )
      })

      flushOutboxSoon()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: libraryKeys.readlists })
    },
  })
}

export function useAddBookToReadlistMutation(readlistId: string) {
  const queryClient = useQueryClient()
  const session = useSessionQuery({ enabled: true })

  return useMutation<ReadlistItemOut, Error, ReadlistBookBody>({
    mutationFn: async (body) => {
      const user = session.data

      if (!user) {
        throw new Error('Not authorized')
      }

      const existing = await db.readlistItems
        .where('[readlistId+bookId]')
        .equals([readlistId, body.book_id])
        .first()
      const item: LocalReadlistItem = {
        id: existing?.id ?? createId(),
        readlistId,
        bookId: body.book_id,
        addedAt: existing?.addedAt ?? new Date().toISOString(),
        deletedAt: undefined,
        dirty: true,
      }

      await db.transaction('rw', db.readlistItems, db.outbox, async () => {
        await db.readlistItems.put(item)
        await db.outbox.put(
          createOutboxItem({
            type: 'http.request',
            entityId: item.id,
            userId: user.id,
            bookId: item.bookId,
            payload: {
              method: 'post',
              path: `/library/readlists/${readlistId}/books`,
              body,
            },
          }),
        )
      })

      flushOutboxSoon()

      return localReadlistItemToOut(item)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: libraryKeys.readlistBooks(readlistId),
      })
    },
  })
}

export function useRemoveBookFromReadlistMutation(readlistId: string) {
  const queryClient = useQueryClient()
  const session = useSessionQuery({ enabled: true })

  return useMutation<void, Error, string>({
    mutationFn: async (bookId) => {
      const user = session.data

      if (!user) {
        throw new Error('Not authorized')
      }

      await db.transaction('rw', db.readlistItems, db.outbox, async () => {
        const item = await db.readlistItems
          .where('[readlistId+bookId]')
          .equals([readlistId, bookId])
          .first()

        if (!item) {
          throw new Error('Collection item is not available offline')
        }

        const deletedItem: LocalReadlistItem = {
          ...item,
          deletedAt: new Date().toISOString(),
          dirty: true,
        }

        await db.readlistItems.put(deletedItem)
        await db.outbox.put(
          createOutboxItem({
            type: 'http.request',
            entityId: item.id,
            userId: user.id,
            bookId,
            payload: {
              method: 'delete',
              path: `/library/readlists/${readlistId}/books/${bookId}`,
            },
          }),
        )
      })

      flushOutboxSoon()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: libraryKeys.readlistBooks(readlistId),
      })
    },
  })
}
