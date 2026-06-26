import { useCallback, useSyncExternalStore } from 'react'

const WORKSPACE_MODE_KEY = 'workspace_mode'
const WORKSPACE_MODE_EVENT = 'workspace-mode-change'

export type WorkspaceMode = 'reader' | 'author'

function readWorkspaceMode(): WorkspaceMode {
  if (typeof localStorage === 'undefined') {
    return 'reader'
  }

  const stored = localStorage.getItem(WORKSPACE_MODE_KEY)

  if (stored === 'author') {
    return 'author'
  }

  return 'reader'
}

export function getWorkspaceMode(): WorkspaceMode {
  return readWorkspaceMode()
}

export function setWorkspaceMode(mode: WorkspaceMode) {
  if (typeof localStorage === 'undefined') {
    return
  }

  localStorage.setItem(WORKSPACE_MODE_KEY, mode)
  window.dispatchEvent(new Event(WORKSPACE_MODE_EVENT))
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  const handler = () => onStoreChange()

  window.addEventListener(WORKSPACE_MODE_EVENT, handler)
  window.addEventListener('storage', handler)

  return () => {
    window.removeEventListener(WORKSPACE_MODE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

export function useWorkspaceMode() {
  const mode = useSyncExternalStore<WorkspaceMode>(
    subscribe,
    readWorkspaceMode,
    (): WorkspaceMode => 'reader',
  )

  const setMode = useCallback((nextMode: WorkspaceMode) => {
    setWorkspaceMode(nextMode)
  }, [])

  return { mode, setMode }
}
