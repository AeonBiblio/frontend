import { redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

import { authApi } from '@shared/api/auth/api'
import { authKeys } from '@shared/api/auth/hooks'
import { apiClient } from '@shared/api/client/api-client'

import type { SessionUser } from '@shared/api/auth/dto'

type RequireAuthArgs = {
  queryClient: QueryClient
}

export async function requireAuth({
  queryClient,
}: RequireAuthArgs): Promise<SessionUser | undefined> {
  if (typeof window === 'undefined') {
    return undefined
  }

  try {
    return await queryClient.ensureQueryData({
      queryKey: authKeys.session(),
      queryFn: () => authApi(apiClient).me(),
    })
  } catch {
    throw redirect({ to: '/login' })
  }
}

export async function redirectAuthorized({
  queryClient,
}: RequireAuthArgs): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  let user: SessionUser | null | undefined

  try {
    user = await queryClient.ensureQueryData({
      queryKey: authKeys.session(),
      queryFn: () => authApi(apiClient).me(),
    })
  } catch {
    return
  }

  if (user) {
    throw redirect({ to: '/' })
  }
}
