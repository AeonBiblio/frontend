import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { useSessionQuery } from '@shared/api/auth'
import { getAccessToken } from '@shared/api/auth/token-storage'

export function useRequireAuth() {
  const navigate = useNavigate()
  const session = useSessionQuery()

  useEffect(() => {
    if (!getAccessToken()) {
      void navigate({ to: '/login' })
    }
  }, [navigate])

  const isAuthorized =
    Boolean(getAccessToken()) && !session.isLoading && Boolean(session.data)

  return { session, isAuthorized }
}
