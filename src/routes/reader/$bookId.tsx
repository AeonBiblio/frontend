import { createFileRoute } from '@tanstack/react-router'

import { bookQueryOptions } from '@modules/books/api'
import { apiClient } from '@shared/api/client/api-client'
import { requireAuth } from '@shared/lib/auth-guard'
import { Spinner } from '@shared/ui/spinner/spinner'

export const Route = createFileRoute('/reader/$bookId')({
  beforeLoad: async ({ context }) => ({
    user: await requireAuth({ queryClient: context.queryClient }),
  }),
  loader: async ({ context, params }) => {
    const bookQuery = bookQueryOptions(params.bookId, apiClient)

    if (typeof window === 'undefined') {
      await context.queryClient
        .ensureQueryData(bookQuery)
        .catch(() => undefined)
    } else {
      void context.queryClient.prefetchQuery(bookQuery).catch(() => undefined)
    }
  },
  pendingComponent: () => (
    <main style={{ padding: '48px 20px', textAlign: 'center' }}>
      <Spinner label="Открываем книгу" />
    </main>
  ),
  head: () => ({
    meta: [{ title: 'Читалка' }],
  }),
})
