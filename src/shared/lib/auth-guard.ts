import { redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

import { authApi } from '@shared/api/auth/api'
import { authKeys } from '@shared/api/auth/hooks'
import { getAccessToken } from '@shared/api/auth/token-storage'
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

  if (!getAccessToken()) {
    throw redirect({ to: '/login' })
  }

  return queryClient.ensureQueryData({
    queryKey: authKeys.session(),
    queryFn: () => authApi(apiClient).me(),
  })
}
