import { queryOptions, useQuery } from '@tanstack/react-query'

import type {
  BookAccessOut,
  BookListItem,
  BookOut,
  BookRatingOut,
} from '@shared/api/core'
import { useSessionQuery } from '@shared/api/auth'
import { useApiClient } from '@shared/api/runtimeConfig/provider/provider'

import type { BookFilters } from '@modules/books/model'
import type { AxiosInstance } from 'axios'
import {
  bookKeys,
  bookListItemToLocalBook,
  cleanBookParams,
  localAccessToBookAccessOut,
  localBookToBookOut,
  localBookToRating,
  readLocalBooksByFilters,
  saveBooksInBackground,
} from './common'

export function booksQueryOptions(filters: BookFilters, client: AxiosInstance) {
  return queryOptions({
    queryKey: bookKeys.list(filters),
    queryFn: async () => {
      try {
        const response = await client.get<BookListItem[]>('/books', {
          params: cleanBookParams(filters),
        })
        const localBooks = response.data.map(bookListItemToLocalBook)

        saveBooksInBackground(localBooks)

        return localBooks
      } catch (error) {
        if (typeof window === 'undefined') {
          throw error
        }

        const localBooks = await readLocalBooksByFilters(filters)

        if (localBooks.length > 0) {
          return localBooks
        }

        throw error
      }
    },
    staleTime: 60 * 1000,
  })
}

export function useBooksQuery(
  filters: BookFilters,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const client = useApiClient()

  return useQuery({
    ...booksQueryOptions(filters, client),
    enabled,
  })
}

export function bookRecommendationsQueryOptions(
  limit: number,
  client: AxiosInstance,
) {
  return queryOptions({
    queryKey: bookKeys.recommendations(limit),
    queryFn: async () => {
      try {
        const response = await client.get<BookListItem[]>(
          '/books/recommendations',
          {
            params: { limit },
          },
        )
        const localBooks = response.data.map(bookListItemToLocalBook)

        saveBooksInBackground(localBooks)

        return localBooks
      } catch {
        return []
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useBookRecommendationsQuery({
  limit = 10,
  enabled = true,
}: { limit?: number; enabled?: boolean } = {}) {
  const client = useApiClient()

  return useQuery({
    ...bookRecommendationsQueryOptions(limit, client),
    enabled,
  })
}

export function useBookQuery(bookId: string, { enabled = true } = {}) {
  const client = useApiClient()

  return useQuery({
    ...bookQueryOptions(bookId, client),
    enabled: enabled && Boolean(bookId),
  })
}

export function bookQueryOptions(bookId: string, client: AxiosInstance) {
  return queryOptions({
    queryKey: bookKeys.details(bookId),
    queryFn: async () => {
      try {
        const response = await client.get<BookOut>(`/books/${bookId}`)
        const [{ bookRepository }, { bookOutToLocalBook }] = await Promise.all([
          import('@domain/repositories'),
          import('@shared/lib/db'),
        ])
        const localBook = bookOutToLocalBook(response.data)

        await bookRepository.save(localBook)

        return localBookToBookOut(
          (await bookRepository.getById(localBook.id)) ?? localBook,
        )
      } catch (error) {
        const { bookRepository } = await import('@domain/repositories')
        const localBook = await bookRepository.getById(bookId)

        if (localBook) {
          return localBookToBookOut(localBook)
        }

        throw error
      }
    },
    staleTime: 60 * 1000,
  })
}

export function useBookRatingQuery(bookId: string, { enabled = true } = {}) {
  const client = useApiClient()

  return useQuery({
    ...bookRatingQueryOptions(bookId, client),
    enabled: enabled && Boolean(bookId),
  })
}

export function bookRatingQueryOptions(bookId: string, client: AxiosInstance) {
  return queryOptions({
    queryKey: bookKeys.rating(bookId),
    queryFn: async () => {
      try {
        const response = await client.get<BookRatingOut>(
          `/books/${bookId}/rating`,
        )
        const { bookRepository } = await import('@domain/repositories')
        const localBook = await bookRepository.getById(bookId)

        if (localBook) {
          await bookRepository.save({
            ...localBook,
            averageRating: response.data.average_rating,
            ratingsCount: response.data.ratings_count,
            reviewsCount: response.data.reviews_count,
            myRating: response.data.my_rating ?? null,
          })
        }

        const savedBook = await bookRepository.getById(bookId)

        return savedBook ? localBookToRating(savedBook) : response.data
      } catch (error) {
        const { bookRepository } = await import('@domain/repositories')
        const localBook = await bookRepository.getById(bookId)

        if (localBook) {
          return localBookToRating(localBook)
        }

        throw error
      }
    },
    staleTime: 60 * 1000,
  })
}

export function useBookAccessQuery(
  bookId: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const client = useApiClient()
  const session = useSessionQuery()
  const userId = session.data?.id

  return useQuery({
    queryKey: bookKeys.access(bookId),
    enabled: enabled && Boolean(bookId) && Boolean(userId),
    retry: false,
    queryFn: async () => {
      if (!userId) {
        throw new Error('Not authorized')
      }

      try {
        const response = await client.get<BookAccessOut>(
          `/books/${bookId}/access`,
        )
        const [{ bookAccessRepository }, { bookAccessOutToLocalBookAccess }] =
          await Promise.all([
            import('@domain/repositories'),
            import('@shared/lib/db'),
          ])
        const localAccess = bookAccessOutToLocalBookAccess(
          response.data,
          userId,
          bookId,
        )

        await bookAccessRepository.save(localAccess)

        return (
          localAccessToBookAccessOut(
            await bookAccessRepository.getByUserAndBook(userId, bookId),
          ) ?? response.data
        )
      } catch (error) {
        const { bookAccessRepository } = await import('@domain/repositories')
        const localAccess = localAccessToBookAccessOut(
          await bookAccessRepository.getByUserAndBook(userId, bookId),
        )

        if (localAccess) {
          return localAccess
        }

        throw error
      }
    },
    staleTime: 60 * 1000,
  })
}
