import type { LocalOutboxItem } from '@shared/lib/db'

import { outboxRepository } from '../domain/outbox-repository'
import { OUTBOX_EVENTS_PATH, toOutboxEvent } from './outbox-event'

class ServiceWorkerDeliveryError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message)
  }
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500
}

export function isRetryableServiceWorkerError(error: unknown) {
  return (
    error instanceof TypeError ||
    (error instanceof ServiceWorkerDeliveryError && error.retryable)
  )
}

export async function deliverFromServiceWorker(item: LocalOutboxItem) {
  const response = await fetch(OUTBOX_EVENTS_PATH, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': item.idempotencyKey,
    },
    body: JSON.stringify(toOutboxEvent(item)),
  })

  if (!response.ok) {
    throw new ServiceWorkerDeliveryError(
      `Failed to deliver ${item.type}: ${response.status}`,
      isRetryableStatus(response.status),
    )
  }

  await outboxRepository.remove(item.id)
}

export async function processOutboxFromServiceWorker() {
  const items = await outboxRepository.getBackgroundSyncDeliverable()
  let retryableError: unknown

  for (const item of items) {
    const claimedItem = await outboxRepository.claim(item.id)

    if (!claimedItem) {
      continue
    }

    try {
      await deliverFromServiceWorker(claimedItem)
    } catch (error) {
      if (isRetryableServiceWorkerError(error)) {
        await outboxRepository.markBgSyncQueued(claimedItem.id, String(error))
        retryableError ??= error
        continue
      }

      await outboxRepository.markFailed(claimedItem.id, String(error))
    }
  }

  if (retryableError) {
    throw retryableError
  }
}
