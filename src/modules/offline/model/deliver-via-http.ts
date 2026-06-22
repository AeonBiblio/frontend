import { apiClient } from '@shared/api/client/api-client'
import type { LocalOutboxItem } from '@shared/lib/db'

import { outboxRepository } from '../domain/outbox-repository'
import { OUTBOX_EVENTS_PATH, toOutboxEvent } from './outbox-event'

export async function deliverViaHttp(item: LocalOutboxItem) {
  const event = toOutboxEvent(item)

  await apiClient.post(OUTBOX_EVENTS_PATH, event, {
    headers: {
      'Idempotency-Key': item.idempotencyKey,
    },
  })

  await outboxRepository.remove(item.id)
}
