import { outboxRepository } from '../domain/outbox-repository'

export async function recoverExpiredBgSyncItems() {
  const expiredItems = await outboxRepository.getExpiredBgSyncQueued()

  for (const item of expiredItems) {
    await outboxRepository.markRetryScheduled(
      item.id,
      'Background Sync did not confirm local outbox before retention window expired',
    )
  }
}
