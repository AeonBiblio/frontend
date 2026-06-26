import type { UserRole } from '@shared/api/core'
import type { WorkspaceMode } from '@shared/lib/use-workspace-mode'

export function getMyBooksPath(
  workspaceMode: WorkspaceMode,
  role: UserRole | undefined,
) {
  if (role === 'author' && workspaceMode === 'author') {
    return '/author/books' as const
  }

  return '/library' as const
}
