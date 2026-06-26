import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import {
  recentLibraryItemSchema,
  readlistItemOutSchema,
  readlistOutSchema,
  userBookStatusOutSchema,
  userSubscriptionOutSchema,
  useAuthedQuery,
} from '@shared/api/core'
import type {
  BookOut,
  CreateReadlistBody,
  ReadlistItemOut,
  ReadlistOut,
  RecentLibraryItem,
  UpdateReadlistBody,
  UserBookStatusOut,
  UserSubscriptionOut,
} from '@shared/api/core'
import { useSessionQuery } from '@shared/api/auth'
import { useApiClient } from '@shared/api/runtimeConfig/provider/provider'

import { enrichBooks } from './enrich-books'

export const libraryKeys = {
  recent: ['library', 'recent'] as const,
  status: ['library', 'status'] as const,
  readlists: ['library', 'readlists'] as const,
  readlistBooks: (readlistId: string) =>
    ['library', 'readlists', readlistId, 'books'] as const,
  enrichedBooks: (bookIds: string[]) =>
    ['library', 'enriched-books', ...[...bookIds].sort()] as const,
  subscriptionMe: ['subscriptions', 'me'] as const,
}

export function useRecentBooksQuery({ enabled = true } = {}) {
  return useAuthedQuery<RecentLibraryItem[]>({
    key: libraryKeys.recent,
    path: '/library/recent',
    params: { limit: 20 },
    enabled,
    staleTime: 60 * 1000,
    select: (data) => z.array(recentLibraryItemSchema).parse(data),
  })
}

export function useBookStatusesQuery({ enabled = true } = {}) {
  return useAuthedQuery<UserBookStatusOut[]>({
    key: libraryKeys.status,
    path: '/library/status',
    enabled,
    staleTime: 60 * 1000,
    select: (data) => z.array(userBookStatusOutSchema).parse(data),
  })
}

export function useReadlistsQuery({ enabled = true } = {}) {
  return useAuthedQuery<ReadlistOut[]>({
    key: libraryKeys.readlists,
    path: '/library/readlists',
    enabled,
    staleTime: 60 * 1000,
    select: (data) => z.array(readlistOutSchema).parse(data),
  })
}

export function useReadlistBooksQuery(
  readlistId: string,
  { enabled = true } = {},
) {
  return useAuthedQuery<ReadlistItemOut[]>({
    key: libraryKeys.readlistBooks(readlistId),
    path: `/library/readlists/${readlistId}/books`,
    enabled: enabled && Boolean(readlistId),
    staleTime: 60 * 1000,
    select: (data) => z.array(readlistItemOutSchema).parse(data),
  })
}

export function useSubscriptionMeQuery({ enabled = true } = {}) {
  const client = useApiClient()
  const session = useSessionQuery()
  const isAuthenticated = session.isSuccess && session.data !== null

  return useQuery<UserSubscriptionOut | null>({
    queryKey: libraryKeys.subscriptionMe,
    enabled: enabled && isAuthenticated,
    staleTime: 60 * 1000,
    retry: false,
    queryFn: async () => {
      const response = await client.get('/subscriptions/me')
      const data = response.data

      if (data == null) {
        return null
      }

      return userSubscriptionOutSchema.parse(data)
    },
  })
}

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

export type EnrichedBookMap = Map<string, BookOut>

export type CreateReadlistInput = CreateReadlistBody
export type UpdateReadlistInput = UpdateReadlistBody
