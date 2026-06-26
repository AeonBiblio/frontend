import { useEffect, useState } from 'react'

function OutboxSyncRuntime() {
  useEffect(() => {
    let disposed = false
    let cleanup: (() => void) | undefined

    const start = async () => {
      const { startOutboxSync } = await import('./use-outbox-sync')

      if (disposed) {
        return
      }

      cleanup = startOutboxSync()
    }

    void start()

    return () => {
      disposed = true
      cleanup?.()
    }
  }, [])

  return null
}

export function OutboxSyncGate() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted ? <OutboxSyncRuntime /> : null
}
