import type {
  CreateReadlistBody,
  ReadlistBookBody,
  ReadlistItemOut,
  ReadlistOut,
  UpdateReadlistBody,
} from '@shared/api/core'
import { useAuthedMutation } from '@shared/api/core'

import { libraryKeys } from './common'

export function useCreateReadlistMutation() {
  return useAuthedMutation<ReadlistOut, CreateReadlistBody>(
    '/library/readlists',
    'post',
    {
      invalidate: libraryKeys.readlists,
    },
  )
}

export function useUpdateReadlistMutation(readlistId: string) {
  return useAuthedMutation<ReadlistOut, UpdateReadlistBody>(
    `/library/readlists/${readlistId}`,
    'patch',
    {
      invalidate: libraryKeys.readlists,
    },
  )
}

export function useDeleteReadlistMutation() {
  return useAuthedMutation<void, string>(
    (readlistId) => `/library/readlists/${readlistId}`,
    'delete',
    {
      invalidate: libraryKeys.readlists,
    },
  )
}

export function useAddBookToReadlistMutation(readlistId: string) {
  return useAuthedMutation<ReadlistItemOut, ReadlistBookBody>(
    `/library/readlists/${readlistId}/books`,
    'post',
    {
      invalidate: libraryKeys.readlistBooks(readlistId),
    },
  )
}

export function useRemoveBookFromReadlistMutation(readlistId: string) {
  return useAuthedMutation<void, string>(
    (bookId) => `/library/readlists/${readlistId}/books/${bookId}`,
    'delete',
    {
      invalidate: libraryKeys.readlistBooks(readlistId),
    },
  )
}
