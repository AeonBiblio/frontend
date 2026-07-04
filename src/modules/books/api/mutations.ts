import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuthedMutation } from '@shared/api/core'
import type {
  BookAccessOut,
  BookOut,
  BookRatingOut,
  PutBookRatingBody,
} from '@shared/api/core'
import { useSessionQuery } from '@shared/api/auth'
import { useApiClient } from '@shared/api/runtimeConfig/provider/provider'
import { bookAccessOutToLocalBookAccess, db } from '@shared/lib/db'
import {
  createOutboxItem,
  flushOutboxSoon,
} from '@modules/offline/model/enqueue-outbox-item'

import { bookKeys } from './common'
import { prefetchReaderChapters } from './reader-download'
import type { PrefetchReaderChaptersOptions } from './reader-download'

export function usePutBookRatingMutation(bookId: string) {
  const queryClient = useQueryClient()
  const session = useSessionQuery({ enabled: true })

  return useMutation<BookRatingOut, Error, PutBookRatingBody>({
    mutationFn: async (body) => {
      const user = session.data

      if (!user) {
        throw new Error('Not authorized')
      }

      const book = await db.books.get(bookId)

      if (!book) {
        throw new Error('Book is not available offline')
      }

      const hadRating = book.myRating !== null && book.myRating !== undefined
      const rating: BookRatingOut = {
        average_rating: book.averageRating ?? null,
        ratings_count: book.ratingsCount + (hadRating ? 0 : 1),
        reviews_count: book.reviewsCount,
        my_rating: body.score,
      }

      await db.transaction('rw', db.books, db.outbox, async () => {
        await db.books.put({
          ...book,
          ratingsCount: rating.ratings_count,
          myRating: body.score,
          cachedAt: new Date().toISOString(),
        })
        await db.outbox.put(
          createOutboxItem({
            type: 'http.request',
            entityId: `${user.id}:${bookId}`,
            userId: user.id,
            bookId,
            payload: {
              method: 'put',
              path: `/books/${bookId}/rating`,
              body,
            },
          }),
        )
      })

      flushOutboxSoon()

      return rating
    },
    onSuccess: (rating) => {
      queryClient.setQueryData(bookKeys.rating(bookId), rating)
      queryClient.setQueryData<BookOut | undefined>(
        bookKeys.details(bookId),
        (book) =>
          book
            ? {
                ...book,
                average_rating: rating.average_rating,
                ratings_count: rating.ratings_count,
                reviews_count: rating.reviews_count,
                my_rating: rating.my_rating ?? null,
              }
            : book,
      )
    },
  })
}

export type PurchaseBookBody = {
  promo_code?: string
}

export function usePurchaseBookMutation(bookId: string) {
  const queryClient = useQueryClient()
  const session = useSessionQuery({ enabled: true })

  return useAuthedMutation<unknown, PurchaseBookBody | void>(
    `/earnings/purchases/${bookId}`,
    'post',
    {
      onSuccess: async () => {
        const userId = session.data?.id
        const previousAccess = queryClient.getQueryData<BookAccessOut | null>(
          bookKeys.access(bookId),
        )
        const purchasedAccess: BookAccessOut = {
          can_read: true,
          reason: 'purchase',
          source: 'purchase',
          file_size_bytes: previousAccess?.file_size_bytes ?? null,
          file_format: previousAccess?.file_format ?? null,
          reader_processing_status: previousAccess?.reader_processing_status,
          reader_manifest_version: previousAccess?.reader_manifest_version,
        }

        queryClient.setQueryData(bookKeys.access(bookId), purchasedAccess)

        if (userId) {
          await db.bookAccess.put(
            bookAccessOutToLocalBookAccess(purchasedAccess, userId, bookId),
          )
        }

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: bookKeys.access(bookId) }),
          queryClient.invalidateQueries({ queryKey: bookKeys.details(bookId) }),
          queryClient.invalidateQueries({ queryKey: ['books', 'list'] }),
          queryClient.invalidateQueries({
            queryKey: ['books', 'recommendations'],
          }),
        ])
      },
    },
  )
}

export function useDeleteBookMutation(bookId: string) {
  return useAuthedMutation<unknown, void>(`/books/${bookId}`, 'delete', {
    invalidate: bookKeys.details(bookId),
  })
}

export function useRecordBookReadMutation(bookId: string) {
  return useAuthedMutation<unknown, void>(`/earnings/reads/${bookId}`, 'post')
}

export function useDownloadBookFileMutation(bookId: string) {
  const client = useApiClient()

  return useMutation<Blob, Error, void>({
    mutationFn: async () => {
      const response = await client.get<Blob>(`/books/${bookId}/content`, {
        responseType: 'blob',
      })

      return response.data
    },
  })
}

export function usePrefetchReaderChaptersMutation(bookId: string) {
  const client = useApiClient()

  return useMutation<
    Awaited<ReturnType<typeof prefetchReaderChapters>>,
    Error,
    PrefetchReaderChaptersOptions
  >({
    mutationFn: (options) => prefetchReaderChapters(client, bookId, options),
  })
}
