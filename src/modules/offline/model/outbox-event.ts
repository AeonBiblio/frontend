import type { LocalOutboxItem, OutboxEventEnvelope } from '@shared/lib/db'

export const OUTBOX_EVENTS_PATH = '/events'
export const OUTBOX_SYNC_TAG = 'book-outbox-sync'

export function toOutboxEvent(item: LocalOutboxItem): OutboxEventEnvelope {
  return {
    id: item.id,
    type: item.type,
    entityKind: item.entityKind,
    entityId: item.entityId,
    userId: item.userId,
    bookId: item.bookId,
    payload: item.payload,
    idempotencyKey: item.idempotencyKey,
    occurredAt: item.createdAt,
  } as OutboxEventEnvelope
}
