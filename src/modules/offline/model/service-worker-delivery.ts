import type { LocalOutboxItem } from '@shared/lib/db'

import { outboxRepository } from '../domain/outbox-repository'
import { OUTBOX_EVENTS_PATH, toOutboxEvent } from './outbox-event'
import { reconcileDeliveredHttpOutboxItem } from './reconcile-http-outbox-item'

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

async function readResponseData(response: Response) {
  if (response.status === 204) {
    return undefined
  }

  const contentType = response.headers.get('content-type')

  if (!contentType?.includes('application/json')) {
    return undefined
  }

  return response.json()
}

export function isRetryableServiceWorkerError(error: unknown) {
  return (
    error instanceof TypeError ||
    (error instanceof ServiceWorkerDeliveryError && error.retryable)
  )
}

export async function deliverFromServiceWorker(item: LocalOutboxItem) {
  const isHttpRequest = item.type === 'http.request'
  const response = await fetch(
    isHttpRequest ? item.payload.path : OUTBOX_EVENTS_PATH,
    {
      method: isHttpRequest ? item.payload.method.toUpperCase() : 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': item.idempotencyKey,
      },
      body: JSON.stringify(
        isHttpRequest ? item.payload.body : toOutboxEvent(item),
      ),
    },
  )

  if (!response.ok) {
    throw new ServiceWorkerDeliveryError(
      `Failed to deliver ${item.type}: ${response.status}`,
      isRetryableStatus(response.status),
    )
  }

  if (isHttpRequest) {
    await reconcileDeliveredHttpOutboxItem(item, await readResponseData(response))
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
