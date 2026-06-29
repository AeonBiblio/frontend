import { queryOptions, useQuery } from '@tanstack/react-query'

import type { GenreTagOut } from '@shared/api/core'
import { useApiClient } from '@shared/api/runtimeConfig/provider/provider'

import type { AxiosInstance } from 'axios'
import {
  genreTagKeys,
  genreTagOutToLocalGenreTag,
  saveGenreTagsInBackground,
} from './common'

export function genreTagsQueryOptions(client: AxiosInstance) {
  return queryOptions({
    queryKey: genreTagKeys.all,
    queryFn: async () => {
      try {
        const response = await client.get<GenreTagOut[]>(
          '/books/genre-tags/all',
        )
        const localTags = response.data.map(genreTagOutToLocalGenreTag)

        saveGenreTagsInBackground(localTags)

        return localTags.map((tag) => ({
          id: tag.id,
          name: tag.name,
        }))
      } catch (error) {
        if (typeof window === 'undefined') {
          throw error
        }

        const { genreTagRepository } = await import('@domain/repositories')
        const localTags = await genreTagRepository.getAll()

        if (localTags.length > 0) {
          return localTags.map((tag) => ({ id: tag.id, name: tag.name }))
        }

        throw error
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useGenreTagsQuery({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const client = useApiClient()

  return useQuery({
    ...genreTagsQueryOptions(client),
    enabled,
  })
}

export function useBookGenreTagsQuery(
  bookId: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const client = useApiClient()

  return useQuery({
    ...bookGenreTagsQueryOptions(bookId, client),
    enabled: enabled && Boolean(bookId),
  })
}

export function bookGenreTagsQueryOptions(
  bookId: string,
  client: AxiosInstance,
) {
  return queryOptions({
    queryKey: genreTagKeys.book(bookId),
    queryFn: async () => {
      try {
        const response = await client.get<GenreTagOut[]>(
          `/books/${bookId}/genre-tags`,
        )
        const [
          { bookGenreTagRepository, genreTagRepository },
          {
            genreTagsToLocalBookGenreTags,
            genreTagOutToLocalGenreTag: mapGenreTagOutToLocalGenreTag,
          },
        ] = await Promise.all([
          import('@domain/repositories'),
          import('@shared/lib/db'),
        ])

        await Promise.all([
          genreTagRepository.saveMany(
            response.data.map(mapGenreTagOutToLocalGenreTag),
          ),
          bookGenreTagRepository.saveMany(
            genreTagsToLocalBookGenreTags(bookId, response.data),
          ),
        ])

        const links = await bookGenreTagRepository.getByBookId(bookId)
        const tags = await Promise.all(
          links.map((link) => genreTagRepository.getById(link.genreTagId)),
        )

        return tags
          .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))
          .map((tag) => ({ id: tag.id, name: tag.name }))
      } catch (error) {
        const { bookGenreTagRepository, genreTagRepository } =
          await import('@domain/repositories')
        const links = await bookGenreTagRepository.getByBookId(bookId)
        const tags = await Promise.all(
          links.map((link) => genreTagRepository.getById(link.genreTagId)),
        )
        const localTags = tags
          .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))
          .map((tag) => ({ id: tag.id, name: tag.name }))

        if (localTags.length > 0) {
          return localTags
        }

        throw error
      }
    },
    staleTime: 60 * 1000,
  })
}
