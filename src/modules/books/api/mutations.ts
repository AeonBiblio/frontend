import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuthedMutation } from '@shared/api/core'
import type { BookRatingOut, PutBookRatingBody } from '@shared/api/core'
import { useSessionQuery } from '@shared/api/auth'
import { useApiClient } from '@shared/api/runtimeConfig/provider/provider'
import { db } from '@shared/lib/db'
import {
  createOutboxItem,
  flushOutboxSoon,
} from '@modules/offline/model/enqueue-outbox-item'

import { bookKeys } from './common'
import { downloadPdfToOpfs } from './pdf-download'
import type { DownloadPdfToOpfsOptions } from './pdf-download'
import { downloadReaderBook, prefetchReaderChapters } from './reader-download'
import type {
  DownloadReaderBookOptions,
  PrefetchReaderChaptersOptions,
} from './reader-download'

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
    },
  })
}

export type PurchaseBookBody = {
  promo_code?: string
}

export function usePurchaseBookMutation(bookId: string) {
  return useAuthedMutation<unknown, PurchaseBookBody | void>(
    `/earnings/purchases/${bookId}`,
    'post',
    {
      invalidate: bookKeys.access(bookId),
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

export function useDownloadPdfToOpfsMutation(bookId: string) {
  const client = useApiClient()

  return useMutation<
    Awaited<ReturnType<typeof downloadPdfToOpfs>>,
    Error,
    {
      fileSizeBytes: number
      options?: DownloadPdfToOpfsOptions
    }
  >({
    mutationFn: ({ fileSizeBytes, options }) =>
      downloadPdfToOpfs(client, bookId, fileSizeBytes, options),
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

export function useDownloadReaderBookMutation(bookId: string) {
  const client = useApiClient()

  return useMutation<
    Awaited<ReturnType<typeof downloadReaderBook>>,
    Error,
    DownloadReaderBookOptions | void
  >({
    mutationFn: (options) => downloadReaderBook(client, bookId, options ?? {}),
  })
}
