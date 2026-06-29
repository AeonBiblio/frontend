import { useQuery } from '@tanstack/react-query'

import { useApiClient } from '@shared/api/runtimeConfig/provider/provider'

import { enrichBooks } from './enrich-books'
import { libraryKeys } from './common'

export function useEnrichedBooksQuery(
  bookIds: string[],
  { enabled = true }: { enabled?: boolean } = {},
) {
  const client = useApiClient()
  const sortedIds = [...new Set(bookIds.filter(Boolean))].sort()

  return useQuery({
    queryKey: libraryKeys.enrichedBooks(sortedIds),
    enabled: enabled && sortedIds.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: () => enrichBooks(client, sortedIds),
  })
}
