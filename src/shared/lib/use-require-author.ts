import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { defaultBookFilters } from '@modules/books/model'
import { useSessionQuery } from '@shared/api/auth'
import { getAccessToken } from '@shared/api/auth/token-storage'

export function useRequireAuthor() {
  const navigate = useNavigate()
  const session = useSessionQuery()

  useEffect(() => {
    if (!getAccessToken()) {
      void navigate({ to: '/login' })
      return
    }

    if (!session.isLoading && session.data?.role !== 'author') {
      void navigate({ to: '/', search: defaultBookFilters })
    }
  }, [navigate, session.data?.role, session.isLoading])

  const isAuthorized =
    Boolean(getAccessToken()) &&
    !session.isLoading &&
    session.data?.role === 'author'

  return { session, isAuthorized }
}
