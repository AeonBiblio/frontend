import type { LocalOutboxItem } from '@shared/lib/db'
import axios from 'axios'

import { outboxRepository } from '../domain/outbox-repository'
import {
  isCanceledRequest,
  isNetworkError,
} from '@shared/api/client/api-client'
import { registerOutboxBackgroundSync } from './outbox-bg-sync'
import { deliverViaHttp } from './deliver-via-http'

export async function deliverOutboxItem(item: LocalOutboxItem) {
  const wasBgSyncQueued = item.status === 'bg_sync_queued'
  const claimedItem = await outboxRepository.claim(item.id)

  if (!claimedItem) {
    return
  }

  if (wasBgSyncQueued) {
    await outboxRepository.markBgSyncQueued(
      claimedItem.id,
      'HTTP fallback skipped because item is already queued in bgSync',
    )
    return
  }

  try {
    await deliverViaHttp(claimedItem)
  } catch (error) {
    if (isNetworkError(error)) {
      const bgSyncRegistered = await registerOutboxBackgroundSync()

      if (bgSyncRegistered) {
        await outboxRepository.markBgSyncQueued(claimedItem.id, String(error))
        return
      }

      await outboxRepository.markRetryScheduled(claimedItem.id, String(error))
      return
    }

    if (
      isCanceledRequest(error) ||
      (axios.isAxiosError(error) &&
        (error.response?.status === 408 ||
          error.response?.status === 429 ||
          (error.response?.status ?? 0) >= 500))
    ) {
      await outboxRepository.markRetryScheduled(claimedItem.id, String(error))
      return
    }

    await outboxRepository.markFailed(claimedItem.id, String(error))
  }
}
