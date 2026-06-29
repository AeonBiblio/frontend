import { db } from '@shared/lib/db'
import type {
  ID,
  LocalOutboxItem,
  LocalSession,
  LocalSyncState,
  OutboxStatus,
  SyncScope,
} from '@shared/lib/db'

import type { EntityRepository } from '../entity-repository'
import { createEntityRepository } from './factory'

export type OutboxEntityRepository = EntityRepository<LocalOutboxItem, ID> & {
  getByStatus: (status: OutboxStatus) => Promise<LocalOutboxItem[]>
  getByEntity: (
    type: LocalOutboxItem['type'],
    entityId: ID,
  ) => Promise<LocalOutboxItem[]>
}

export const outboxEntityRepository: OutboxEntityRepository = {
  ...createEntityRepository(db.outbox),
  getByStatus(status) {
    return db.outbox.where('status').equals(status).toArray()
  },
  getByEntity(type, entityId) {
    return db.outbox.where('[type+entityId]').equals([type, entityId]).toArray()
  },
}

export type SyncStateRepository = EntityRepository<LocalSyncState, ID> & {
  getByScope: (scope: SyncScope) => Promise<LocalSyncState | undefined>
}

export const syncStateRepository: SyncStateRepository = {
  ...createEntityRepository(db.syncState),
  getByScope(scope) {
    return db.syncState.where('scope').equals(scope).first()
  },
}

export type SessionRepository = EntityRepository<
  LocalSession,
  LocalSession['key']
> & {
  getCurrent: () => Promise<LocalSession | undefined>
  setCurrent: (session: LocalSession) => Promise<LocalSession['key']>
  clearCurrent: () => Promise<void>
}

export const sessionRepository: SessionRepository = {
  ...createEntityRepository(db.session),
  getCurrent() {
    return db.session.get('current')
  },
  setCurrent(session) {
    return db.session.put(session)
  },
  clearCurrent() {
    return db.session.delete('current')
  },
}
