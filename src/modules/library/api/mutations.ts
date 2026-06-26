import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosInstance } from 'axios'

import type {
  CreateReadlistBody,
  ReadlistBookBody,
  ReadlistItemOut,
  ReadlistOut,
  UpdateReadlistBody,
} from '@shared/api/core'
import { useApiClient } from '@shared/api/runtimeConfig/provider/provider'

import { libraryKeys } from './hooks'

async function createReadlist(
  client: AxiosInstance,
  body: CreateReadlistBody,
): Promise<ReadlistOut> {
  const response = await client.post<ReadlistOut>('/library/readlists', body)
  return response.data
}

async function updateReadlist(
  client: AxiosInstance,
  readlistId: string,
  body: UpdateReadlistBody,
): Promise<ReadlistOut> {
  const response = await client.patch<ReadlistOut>(
    `/library/readlists/${readlistId}`,
    body,
  )
  return response.data
}

async function deleteReadlist(
  client: AxiosInstance,
  readlistId: string,
): Promise<void> {
  await client.delete(`/library/readlists/${readlistId}`)
}

async function addBookToReadlist(
  client: AxiosInstance,
  readlistId: string,
  body: ReadlistBookBody,
): Promise<ReadlistItemOut> {
  const response = await client.post<ReadlistItemOut>(
    `/library/readlists/${readlistId}/books`,
    body,
  )
  return response.data
}

export function useCreateReadlistMutation() {
  const client = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateReadlistBody) => createReadlist(client, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: libraryKeys.readlists })
    },
  })
}

export function useUpdateReadlistMutation(readlistId: string) {
  const client = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: UpdateReadlistBody) =>
      updateReadlist(client, readlistId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: libraryKeys.readlists })
    },
  })
}

export function useDeleteReadlistMutation() {
  const client = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (readlistId: string) => deleteReadlist(client, readlistId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: libraryKeys.readlists })
    },
  })
}

export function useAddBookToReadlistMutation(readlistId: string) {
  const client = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: ReadlistBookBody) =>
      addBookToReadlist(client, readlistId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: libraryKeys.readlistBooks(readlistId),
      })
    },
  })
}
