import type { UserRole } from '@shared/api/core'

export function getMyBooksPath(role: UserRole | undefined) {
  if (role === 'author') {
    return '/author/books' as const
  }

  return '/library' as const
}
