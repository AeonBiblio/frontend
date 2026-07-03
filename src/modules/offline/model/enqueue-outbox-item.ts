import type {
  LocalOutboxItem,
  OutboxEntityKindMap,
  OutboxEventPayloadMap,
  OutboxType,
} from '@shared/lib/db'

import { flushOutbox } from './flush-outbox'

const entityKindByType = {
  'http.request': 'http-request',
  'progress.update': 'progress',
  'book-state.update': 'book-state',
  'reader-settings.update': 'reader-settings',
  'annotation.create': 'annotation',
  'annotation.update': 'annotation',
  'annotation.delete': 'annotation',
  'readlist.create': 'readlist',
  'readlist.update': 'readlist',
  'readlist.delete': 'readlist',
  'readlist-item.create': 'readlist-item',
  'readlist-item.delete': 'readlist-item',
  'review.create': 'review',
  'review.update': 'review',
  'review.delete': 'review',
} satisfies {
  [TType in OutboxType]: OutboxEntityKindMap[TType]
}

function createId() {
  return globalThis.crypto.randomUUID()
}

export function createOutboxItem<TType extends OutboxType>({
  type,
  entityId,
  userId,
  bookId,
  payload,
}: {
  type: TType
  entityId: string
  userId?: string
  bookId?: string
  payload: OutboxEventPayloadMap[TType]
}): LocalOutboxItem<TType> {
  const now = new Date().toISOString()
  const id = createId()

  return {
    id,
    type,
    entityKind: entityKindByType[type],
    entityId,
    userId,
    bookId,
    payload,
    status: 'pending',
    attempts: 0,
    idempotencyKey: id,
    createdAt: now,
    updatedAt: now,
  } as LocalOutboxItem<TType>
}

export function flushOutboxSoon() {
  void flushOutbox()
}
