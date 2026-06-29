import { createFileRoute } from '@tanstack/react-router'

import {
  bookRecommendationsQueryOptions,
  booksQueryOptions,
  genreTagsQueryOptions,
} from '@modules/books/api'
import { getIndexLoaderDeps, IndexPage, indexSearchSchema } from '@pages/index'
import { apiClient } from '@shared/api/client/api-client'
import { Spinner } from '@shared/ui/spinner/spinner'

export const Route = createFileRoute('/')({
  validateSearch: (search) => indexSearchSchema.parse(search),

  loaderDeps: ({ search }) => getIndexLoaderDeps(search),

  loader: async ({ context, deps }) => {
    const booksQuery = booksQueryOptions(deps.filters, apiClient)
    const recommendationsQuery = bookRecommendationsQueryOptions(10, apiClient)
    const genreTagsQuery = genreTagsQueryOptions(apiClient)

    await Promise.all([
      context.queryClient.ensureQueryData(booksQuery).catch(() => undefined),

      context.queryClient
        .ensureQueryData(recommendationsQuery)
        .catch(() => undefined),

      context.queryClient
        .ensureQueryData(genreTagsQuery)
        .catch(() => undefined),
    ])
  },

  pendingComponent: () => (
    <main style={{ padding: '48px 20px', textAlign: 'center' }}>
      <Spinner label="Загружаем библиотеку" />
    </main>
  ),

  component: IndexPage,
})
