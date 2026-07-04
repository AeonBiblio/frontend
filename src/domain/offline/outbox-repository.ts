import { db } from '@shared/lib/db'
import type { LocalOutboxItem } from '@shared/lib/db'

const PROCESSING_LEASE_MS = 15_000
const BG_SYNC_RETENTION_MS = 24 * 60 * 60 * 1000
const BG_SYNC_EXPIRY_GRACE_MS = 20 * 60 * 1000
const RETRY_DELAY_MS = 30_000

function nowIso() {
  return new Date().toISOString()
}

export const outboxRepository = {
  async add(item: LocalOutboxItem) {
    await db.outbox.put(item)
  },

  async getById(id: string) {
    return db.outbox.get(id)
  },

  async getPending(limit = 20) {
    const nowMs = Date.now()
    const items = await db.outbox
      .where('status')
      .anyOf('pending', 'processing', 'retry_scheduled')
      .toArray()

    return items
      .filter((item) => {
        if (item.status === 'pending') {
          return true
        }

        if (item.status === 'processing') {
          return (
            item.processingUntil === undefined ||
            new Date(item.processingUntil).getTime() <= nowMs
          )
        }

        return (
          item.nextRetryAt === undefined ||
          new Date(item.nextRetryAt).getTime() <= nowMs
        )
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, limit)
  },

  async claim(id: string) {
    const nowMs = Date.now()
    const processingUntil = new Date(nowMs + PROCESSING_LEASE_MS).toISOString()

    return db.transaction('rw', db.outbox, async () => {
      const item = await db.outbox.get(id)

      if (!item) {
        return null
      }

      const isLocked =
        item.status === 'processing' &&
        item.processingUntil &&
        new Date(item.processingUntil).getTime() > nowMs

      if (isLocked) {
        return null
      }

      const updatedItem: LocalOutboxItem = {
        ...item,
        status: 'processing',
        attempts: item.attempts + 1,
        processingUntil,
        updatedAt: nowIso(),
      }

      await db.outbox.put(updatedItem)

      return updatedItem
    })
  },

  async markPending(id: string, error?: string) {
    await db.outbox.update(id, {
      status: 'pending',
      lastError: error,
      nextRetryAt: undefined,
      processingUntil: undefined,
      bgSyncQueuedAt: undefined,
      bgSyncExpiresAt: undefined,
      updatedAt: nowIso(),
    })
  },

  async markRetryScheduled(id: string, error?: string) {
    const nowMs = Date.now()

    await db.outbox.update(id, {
      status: 'retry_scheduled',
      lastError: error,
      nextRetryAt: new Date(nowMs + RETRY_DELAY_MS).toISOString(),
      processingUntil: undefined,
      bgSyncQueuedAt: undefined,
      bgSyncExpiresAt: undefined,
      updatedAt: new Date(nowMs).toISOString(),
    })
  },

  async markBgSyncQueued(id: string, error?: string) {
    const nowMs = Date.now()
    const now = new Date(nowMs).toISOString()
    const defaultBgSyncExpiresAt = new Date(
      nowMs + BG_SYNC_RETENTION_MS + BG_SYNC_EXPIRY_GRACE_MS,
    ).toISOString()
    const item = await db.outbox.get(id)

    await db.outbox.update(id, {
      status: 'bg_sync_queued',
      bgSyncQueuedAt: item?.bgSyncQueuedAt ?? now,
      bgSyncExpiresAt: item?.bgSyncExpiresAt ?? defaultBgSyncExpiresAt,
      lastError: error,
      nextRetryAt: undefined,
      processingUntil: undefined,
      updatedAt: now,
    })
  },

  async getExpiredBgSyncQueued(now = nowIso(), limit = 20) {
    const items = await db.outbox
      .where('status')
      .equals('bg_sync_queued')
      .toArray()

    return items
      .filter(
        (item) =>
          item.bgSyncExpiresAt !== undefined && item.bgSyncExpiresAt <= now,
      )
      .sort((a, b) =>
        (a.bgSyncExpiresAt ?? a.updatedAt).localeCompare(
          b.bgSyncExpiresAt ?? b.updatedAt,
        ),
      )
      .slice(0, limit)
  },

  async markFailed(id: string, error: string) {
    await db.outbox.update(id, {
      status: 'failed',
      lastError: error,
      nextRetryAt: undefined,
      processingUntil: undefined,
      bgSyncQueuedAt: undefined,
      bgSyncExpiresAt: undefined,
      updatedAt: nowIso(),
    })
  },

  async remove(id: string) {
    await db.outbox.delete(id)
  },

  async getBackgroundSyncDeliverable(limit = 20) {
    const now = nowIso()
    const items = await db.outbox
      .where('status')
      .anyOf('pending', 'processing', 'retry_scheduled', 'bg_sync_queued')
      .toArray()

    return items
      .filter((item) => {
        if (item.status === 'processing') {
          return (
            item.processingUntil === undefined || item.processingUntil <= now
          )
        }

        if (item.status !== 'retry_scheduled') {
          return true
        }

        return item.nextRetryAt === undefined || item.nextRetryAt <= now
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, limit)
  },
}
