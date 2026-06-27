import { useQuery } from '@tanstack/react-query'

import { useAuthedMutation, useApiQuery } from '@shared/api/core'
import type {
  GenreTagOut,
  BookListItem,
  BookOut,
  CardPaymentBody,
} from '@shared/api/core'
import { useApiClient } from '@shared/api/runtimeConfig/provider/provider'

import type { BookFilters } from '@modules/books/model'
import type { LocalBook } from '@shared/lib/db'

export const bookKeys = {
  list: (filters: BookFilters) => ['books', 'list', filters] as const,
  details: (bookId: string) => ['books', bookId] as const,
}

export const genreTagKeys = {
  all: ['genre-tags'] as const,
  book: (bookId: string) => ['books', bookId, 'genre-tags'] as const,
}

const cleanBookParams = (filters: BookFilters) => ({
  q: filters.q || undefined,
  status: filters.status || undefined,
  author_id: filters.author_id || undefined,
  genre_tag_id: filters.genre_tag_id || undefined,
  in_subscription: filters.in_subscription,
  for_sale: filters.for_sale,
  offset: filters.offset,
  limit: filters.limit,
})

async function readLocalBooksByFilters(filters: BookFilters) {
  const { bookRepository } = await import('@domain/repositories')
  let books = await bookRepository.getAll()

  if (filters.q) {
    const query = filters.q.toLocaleLowerCase()
    books = books.filter((book) =>
      book.title.toLocaleLowerCase().includes(query),
    )
  }

  if (filters.status) {
    books = books.filter((book) => book.status === filters.status)
  }

  if (filters.author_id) {
    books = books.filter((book) => book.authorId === filters.author_id)
  }

  if (typeof filters.in_subscription === 'boolean') {
    books = books.filter(
      (book) => book.isInSubscription === filters.in_subscription,
    )
  }

  if (typeof filters.for_sale === 'boolean') {
    books = books.filter((book) => book.isForSale === filters.for_sale)
  }

  return books.slice(filters.offset, filters.offset + filters.limit)
}

async function readSavedBooks(ids: string[]) {
  const { bookRepository } = await import('@domain/repositories')
  const books = await Promise.all(ids.map((id) => bookRepository.getById(id)))
  return books.filter((book): book is LocalBook => Boolean(book))
}

export function useBooksQuery(
  filters: BookFilters,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const client = useApiClient()

  return useQuery({
    queryKey: bookKeys.list(filters),
    enabled,
    queryFn: async () => {
      try {
        const response = await client.get<BookListItem[]>('/books', {
          params: cleanBookParams(filters),
        })
        const [{ bookRepository }, { bookListItemToLocalBook }] =
          await Promise.all([
            import('@domain/repositories'),
            import('@shared/lib/db'),
          ])
        const localBooks = response.data.map(bookListItemToLocalBook)

        if (localBooks.length > 0) {
          await bookRepository.saveMany(localBooks)
        }

        return readSavedBooks(localBooks.map((book) => book.id))
      } catch (error) {
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

export function useBookQuery(bookId: string, { enabled = true } = {}) {
  return useApiQuery<BookOut>({
    key: bookKeys.details(bookId),
    path: `/books/${bookId}`,
    enabled: enabled && Boolean(bookId),
    staleTime: 60 * 1000,
  })
}

export function usePurchaseBookMutation(bookId: string) {
  return useAuthedMutation<unknown, CardPaymentBody>(
    `/earnings/purchases/${bookId}`,
    'post',
  )
}

export function useGenreTagsQuery({
  enabled = true,
}: { enabled?: boolean } = {}) {
  return useApiQuery<GenreTagOut[]>({
    key: genreTagKeys.all,
    path: '/books/genre-tags/all',
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export function useBookGenreTagsQuery(
  bookId: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useApiQuery<GenreTagOut[]>({
    key: genreTagKeys.book(bookId),
    path: `/books/${bookId}/genre-tags`,
    enabled: enabled && Boolean(bookId),
    staleTime: 60 * 1000,
  })
}
