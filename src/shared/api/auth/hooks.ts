import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

import { useApiClient } from '../runtimeConfig/provider/provider'
import { authApi } from './api'
import type { LoginDto, RegisterDto, SessionUser } from './dto'

export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
}

export function useSessionQuery({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const client = useApiClient()
  const api = authApi(client)

  return useQuery<SessionUser | null>({
    queryKey: authKeys.session(),
    enabled,
    queryFn: async ({ signal }) => {
      try {
        return await api.me(signal)
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          return null
        }

        throw error
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

export function useLoginMutation() {
  const client = useApiClient()
  const queryClient = useQueryClient()
  const api = authApi(client)

  return useMutation<{ ok: true }, unknown, LoginDto>({
    mutationFn: api.login,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: authKeys.session(),
      })
    },
  })
}

export function useRegisterMutation() {
  const client = useApiClient()
  const queryClient = useQueryClient()
  const api = authApi(client)

  return useMutation<
    { message: string; user: SessionUser },
    unknown,
    RegisterDto
  >({
    mutationFn: api.register,
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.session(), data.user)
    },
  })
}

export function useLogoutMutation() {
  const client = useApiClient()
  const queryClient = useQueryClient()
  const api = authApi(client)

  return useMutation<{ ok: true }, unknown, void>({
    mutationFn: api.logout,
    onSuccess: () => {
      queryClient.setQueryData(authKeys.session(), null)
      queryClient.invalidateQueries({
        queryKey: authKeys.session(),
      })
    },
  })
}
