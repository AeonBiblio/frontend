import { db } from '@shared/lib/db'
import { apiClient } from '@shared/api/client/api-client'
import type { RetryableAxiosRequestConfig } from '@shared/api/client/api-client'
import {
  createOutboxItem,
  flushOutboxSoon,
} from '@modules/offline/model/enqueue-outbox-item'

import type { LocalReadingProgress } from '@shared/lib/db'

const PROGRESS_SYNC_DELAY_MS = 700
const timers = new Map<string, number>()

type ReaderProgressResponse = {
  cfi?: string | null
  chapter_id?: string | null
  chapter_index?: number | null
  chapter_offset?: number | null
  page_count?: number | null
  page_index?: number | null
  percentage?: number | null
  settings_hash?: string | null
  updated_at?: string | null
}

function clearProgressTimer(id: string) {
  const timer = timers.get(id)

  if (timer !== undefined) {
    window.clearTimeout(timer)
    timers.delete(id)
  }
}

function progressToRequestBody(progress: LocalReadingProgress) {
  return {
    chapter_id: progress.chapterId,
    chapter_index: progress.chapterIndex,
    chapter_offset: progress.chapterOffset,
    page_index: progress.pageIndex,
    page_count: progress.pageCount,
    percentage: progress.percentage,
    cfi: progress.cfi,
    settings_hash: progress.settingsHash,
    updated_at: progress.updatedAt,
  }
}

function remoteProgressToLocalProgress({
  bookId,
  data,
  userId,
}: {
  bookId: string
  data: ReaderProgressResponse
  userId: string
}): LocalReadingProgress | null {
  if (!data.chapter_id) {
    return null
  }

  return {
    id: `${userId}:${bookId}`,
    userId,
    bookId,
    chapterId: data.chapter_id,
    chapterIndex: data.chapter_index ?? undefined,
    chapterOffset: data.chapter_offset ?? 0,
    pageIndex: data.page_index ?? undefined,
    pageCount: data.page_count ?? undefined,
    percentage: data.percentage ?? 0,
    cfi: data.cfi ?? undefined,
    settingsHash: data.settings_hash ?? undefined,
    updatedAt: data.updated_at ?? new Date().toISOString(),
    syncedAt: new Date().toISOString(),
    dirty: false,
  }
}

function isRemoteProgressNewer(
  localProgress: LocalReadingProgress | undefined,
  remoteProgress: LocalReadingProgress,
) {
  if (!localProgress) {
    return true
  }

  return (
    Date.parse(remoteProgress.updatedAt) > Date.parse(localProgress.updatedAt)
  )
}

export async function loadReadingProgress(userId: string, bookId: string) {
  const localProgress = await db.readingProgress
    .where('[userId+bookId]')
    .equals([userId, bookId])
    .first()

  try {
    const response = await apiClient.request<ReaderProgressResponse>({
      method: 'get',
      url: `/books/${bookId}/reader/progress`,
      suppressAuthRedirect: true,
    } as RetryableAxiosRequestConfig)
    const remoteProgress = remoteProgressToLocalProgress({
      bookId,
      data: response.data,
      userId,
    })

    if (!remoteProgress) {
      return localProgress ?? null
    }

    if (!isRemoteProgressNewer(localProgress, remoteProgress)) {
      return localProgress ?? null
    }

    await db.readingProgress.put(remoteProgress)

    return remoteProgress
  } catch {
    return localProgress ?? null
  }
}

async function upsertProgressOutboxItem(progress: LocalReadingProgress) {
  const existing = await db.outbox
    .where('[type+entityId]')
    .equals(['http.request', progress.id])
    .filter((item) => item.status !== 'processing')
    .first()
  const payload = {
    method: 'put' as const,
    path: `/books/${progress.bookId}/reader/progress`,
    body: progressToRequestBody(progress),
  }

  if (existing && existing.type === 'http.request') {
    await db.outbox.put({
      ...existing,
      payload,
      status:
        existing.status === 'failed' || existing.status === 'bg_sync_queued'
          ? 'pending'
          : existing.status,
      updatedAt: new Date().toISOString(),
      nextRetryAt: undefined,
      lastError: undefined,
    })
    return
  }

  await db.outbox.put(
    createOutboxItem({
      type: 'http.request',
      entityId: progress.id,
      userId: progress.userId,
      bookId: progress.bookId,
      payload,
    }),
  )
}

export async function saveReadingProgress(progress: LocalReadingProgress) {
  await db.readingProgress.put(progress)

  if (typeof window === 'undefined') {
    return
  }

  clearProgressTimer(progress.id)

  const timer = window.setTimeout(() => {
    timers.delete(progress.id)
    void upsertProgressOutboxItem(progress).then(flushOutboxSoon)
  }, PROGRESS_SYNC_DELAY_MS)

  timers.set(progress.id, timer)
}

export async function savePdfReadingProgress({
  bookId,
  pageCount,
  pageNumber,
  scale,
  userId,
}: {
  bookId: string
  pageCount: number
  pageNumber: number
  scale: number
  userId: string
}) {
  const pageIndex = Math.max(0, pageNumber - 1)
  const percentage =
    pageCount <= 1 ? 100 : (pageIndex / Math.max(1, pageCount - 1)) * 100
  const updatedAt = new Date().toISOString()

  await db.pdfProgress.put({
    bookId,
    pageNumber,
    scale,
    scrollTop: 0,
    updatedAt: Date.now(),
  })

  await saveReadingProgress({
    id: `${userId}:${bookId}`,
    userId,
    bookId,
    chapterId: `pdf:${bookId}`,
    chapterIndex: 0,
    chapterOffset: 0,
    pageIndex,
    pageCount,
    percentage,
    settingsHash: `pdf:${scale}`,
    updatedAt,
    dirty: true,
  })
}
