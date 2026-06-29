import { createFileRoute } from '@tanstack/react-router'

import {
  bookGenreTagsQueryOptions,
  bookQueryOptions,
  bookRatingQueryOptions,
} from '@modules/books/api'
import { apiClient } from '@shared/api/client/api-client'
import { Spinner } from '@shared/ui/spinner/spinner'

export const Route = createFileRoute('/books/$bookId')({
  loader: async ({ context, params }) => {
    const bookQuery = bookQueryOptions(params.bookId, apiClient)

    if (typeof window === 'undefined') {
      await context.queryClient
        .ensureQueryData(bookQuery)
        .catch(() => undefined)
    } else {
      void context.queryClient.prefetchQuery(bookQuery).catch(() => undefined)
    }

    void context.queryClient
      .prefetchQuery(bookRatingQueryOptions(params.bookId, apiClient))
      .catch(() => undefined)
    void context.queryClient
      .prefetchQuery(bookGenreTagsQueryOptions(params.bookId, apiClient))
      .catch(() => undefined)
  },
  pendingComponent: () => (
    <main style={{ padding: '48px 20px', textAlign: 'center' }}>
      <Spinner label="Загружаем книгу" />
    </main>
  ),
  head: () => ({
    meta: [{ title: 'Книга' }],
  }),
})
