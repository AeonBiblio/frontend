import { redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

import { authApi } from '@shared/api/auth/api'
import { authKeys } from '@shared/api/auth/hooks'
import { apiClient } from '@shared/api/client/api-client'

import type { SessionUser } from '@shared/api/auth/dto'

type RequireAuthorArgs = {
  queryClient: QueryClient
}

export async function requireAuthor({
  queryClient,
}: RequireAuthorArgs): Promise<SessionUser | undefined> {
  if (typeof window === 'undefined') {
    return undefined
  }

  let user: SessionUser
  try {
    user = await queryClient.ensureQueryData({
      queryKey: authKeys.session(),
      queryFn: () => authApi(apiClient).me(),
    })
  } catch {
    throw redirect({ to: '/login' })
  }

  if (user.role !== 'author') {
    throw redirect({ to: '/library' })
  }

  return user
}
