import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { useSessionQuery } from '@shared/api/auth'

export function useRequireAuth() {
  const navigate = useNavigate()
  const session = useSessionQuery()

  useEffect(() => {
    if (!session.isLoading && !session.data) {
      void navigate({ to: '/login' })
    }
  }, [navigate, session.data, session.isLoading])

  const isAuthorized = !session.isLoading && Boolean(session.data)

  return { session, isAuthorized }
}
