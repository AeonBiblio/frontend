import { outboxRepository } from '../domain/outbox-repository'
import { deliverOutboxItem } from './deliver-outbox-item'
import { recoverExpiredBgSyncItems } from './recover-expired-bg-sync-items'

let flushPromise: Promise<void> | null = null

async function runFlushOutbox() {
  await recoverExpiredBgSyncItems()

  const items = await outboxRepository.getPending()

  for (const item of items) {
    await deliverOutboxItem(item)
  }

  await recoverExpiredBgSyncItems()
}

export function flushOutbox() {
  if (flushPromise) {
    return flushPromise
  }

  flushPromise = runFlushOutbox().finally(() => {
    flushPromise = null
  })

  return flushPromise
}
