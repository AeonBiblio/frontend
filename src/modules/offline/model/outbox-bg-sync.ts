import { OUTBOX_SYNC_TAG } from './outbox-event'

type SyncManagerLike = {
  register: (tag: string) => Promise<void>
}

function isSyncManagerLike(value: unknown): value is SyncManagerLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'register' in value &&
    typeof value.register === 'function'
  )
}

function getSyncManager(
  registration: ServiceWorkerRegistration,
): SyncManagerLike | null {
  const sync = (registration as unknown as { sync?: unknown }).sync

  if (!isSyncManagerLike(sync)) {
    return null
  }

  return sync
}

export async function registerOutboxBackgroundSync() {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const sync = getSyncManager(registration)

    if (!sync) {
      return false
    }

    await sync.register(OUTBOX_SYNC_TAG)

    return true
  } catch {
    return false
  }
}
