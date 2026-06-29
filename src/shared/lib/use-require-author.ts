import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { useSessionQuery } from '@shared/api/auth'

export function useRequireAuthor() {
  const navigate = useNavigate()
  const session = useSessionQuery()

  useEffect(() => {
    if (!session.isLoading && !session.data) {
      void navigate({ to: '/login' })
      return
    }

    if (!session.isLoading && session.data?.role !== 'author') {
      void navigate({ to: '/' })
    }
  }, [navigate, session.data?.role, session.isLoading])

  const isAuthorized = !session.isLoading && session.data?.role === 'author'

  return { session, isAuthorized }
}
