import clsx from 'clsx'
import { useNavigate } from '@tanstack/react-router'

import type { UserRole } from '@shared/api/core'
import type { WorkspaceMode } from '@shared/lib/use-workspace-mode'

import styles from './role-mode-toggle.module.scss'

type RoleModeToggleProps = {
  mode: WorkspaceMode
  role: UserRole
  onChange: (mode: WorkspaceMode) => void
}

export function RoleModeToggle({ mode, role, onChange }: RoleModeToggleProps) {
  const navigate = useNavigate()

  const handleChange = (nextMode: WorkspaceMode) => {
    onChange(nextMode)
    void navigate({ to: nextMode === 'author' ? '/author/books' : '/library' })
  }

  return (
    <div className={styles.toggle} role="group" aria-label="Режим работы">
      <button
        className={clsx(
          styles.toggleButton,
          mode === 'reader' && styles.toggleButtonActive,
        )}
        type="button"
        onClick={() => handleChange('reader')}
      >
        Читатель
      </button>
      {role === 'author' ? (
        <button
          className={clsx(
            styles.toggleButton,
            mode === 'author' && styles.toggleButtonActive,
          )}
          type="button"
          onClick={() => handleChange('author')}
        >
          Писатель
        </button>
      ) : null}
    </div>
  )
}
