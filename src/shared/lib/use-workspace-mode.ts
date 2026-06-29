import { useCallback, useEffect, useSyncExternalStore } from 'react'

const WORKSPACE_MODE_KEY = 'workspace_mode'
const WORKSPACE_MODE_EVENT = 'workspace-mode-change'
const HYDRATION_WORKSPACE_MODE_EVENT = 'workspace-mode-hydration-change'

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

function setWorkspaceMode(mode: WorkspaceMode) {
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
  window.addEventListener(HYDRATION_WORKSPACE_MODE_EVENT, handler)
  window.addEventListener('storage', handler)

  return () => {
    window.removeEventListener(WORKSPACE_MODE_EVENT, handler)
    window.removeEventListener(HYDRATION_WORKSPACE_MODE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

export function useWorkspaceMode() {
  useEffect(() => {
    window.dispatchEvent(new Event(HYDRATION_WORKSPACE_MODE_EVENT))
  }, [])

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
