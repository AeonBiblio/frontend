import { useMutation } from '@tanstack/react-query'

import { useAuthedMutation } from '@shared/api/core'
import type { BookRatingOut, PutBookRatingBody } from '@shared/api/core'
import { useApiClient } from '@shared/api/runtimeConfig/provider/provider'

import { bookKeys } from './common'

export function usePutBookRatingMutation(bookId: string) {
  return useAuthedMutation<BookRatingOut, PutBookRatingBody>(
    `/books/${bookId}/rating`,
    'put',
    {
      invalidate: bookKeys.rating(bookId),
    },
  )
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
