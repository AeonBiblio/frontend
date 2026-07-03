import { db } from '@shared/lib/db'
import {
  createOutboxItem,
  flushOutboxSoon,
} from '@modules/offline/model/enqueue-outbox-item'

import type { LocalAnnotation } from '@shared/lib/db'

export type ReaderBookmarkLocator = {
  bookId: string
  chapterId: string
  chapterIndex?: number
  pageIndex?: number
  pageNumber?: number
  pageCount?: number
  percentage?: number
  settingsHash?: string
  userId: string
}

function pageKey(locator: ReaderBookmarkLocator) {
  return locator.pageNumber ?? locator.pageIndex ?? 0
}

export function createReaderBookmarkId(locator: ReaderBookmarkLocator) {
  return [
    'bookmark',
    locator.userId,
    locator.bookId,
    locator.chapterId,
    pageKey(locator),
    locator.settingsHash ?? 'default',
  ].join(':')
}

function annotationToRequestBody(annotation: LocalAnnotation) {
  return {
    id: annotation.id,
    chapter_id: annotation.chapterId,
    chapter_index: annotation.chapterIndex,
    type: annotation.type,
    page_index: annotation.pageIndex,
    page_number: annotation.pageNumber,
    page_count: annotation.pageCount,
    percentage: annotation.percentage,
    settings_hash: annotation.settingsHash,
    range: annotation.range,
    quote: annotation.quote,
    color: annotation.color,
    text: annotation.text,
    note: annotation.note,
    created_at: annotation.createdAt,
    updated_at: annotation.updatedAt,
    deleted_at: annotation.deletedAt,
  }
}

async function enqueueAnnotation(annotation: LocalAnnotation) {
  await db.outbox.put(
    createOutboxItem({
      type: 'http.request',
      entityId: annotation.id,
      userId: annotation.userId,
      bookId: annotation.bookId,
      payload: {
        method: 'put',
        path: `/books/${annotation.bookId}/reader/annotations/${annotation.id}`,
        body: annotationToRequestBody(annotation),
      },
    }),
  )
  flushOutboxSoon()
}

async function enqueueAnnotationDelete(annotation: LocalAnnotation) {
  await db.outbox.put(
    createOutboxItem({
      type: 'http.request',
      entityId: annotation.id,
      userId: annotation.userId,
      bookId: annotation.bookId,
      payload: {
        method: 'delete',
        path: `/books/${annotation.bookId}/reader/annotations/${annotation.id}`,
      },
    }),
  )
  flushOutboxSoon()
}

export async function getReaderBookmark(locator: ReaderBookmarkLocator) {
  const annotation = await db.annotations.get(createReaderBookmarkId(locator))

  if (!annotation || annotation.deletedAt) {
    return null
  }

  return annotation
}

export async function getReaderBookmarks(bookId: string, userId: string) {
  return db.annotations
    .where('bookId')
    .equals(bookId)
    .filter(
      (annotation) =>
        annotation.userId === userId &&
        annotation.type === 'bookmark' &&
        !annotation.deletedAt,
    )
    .toArray()
}

export async function setReaderBookmark(
  locator: ReaderBookmarkLocator,
  isBookmarked: boolean,
) {
  const id = createReaderBookmarkId(locator)
  const existing = await db.annotations.get(id)
  const now = new Date().toISOString()

  if (!isBookmarked) {
    if (!existing || existing.deletedAt) {
      return null
    }

    const deletedAnnotation: LocalAnnotation = {
      ...existing,
      deletedAt: now,
      updatedAt: now,
      dirty: true,
    }

    await db.annotations.put(deletedAnnotation)
    await enqueueAnnotationDelete(deletedAnnotation)

    return null
  }

  const annotation: LocalAnnotation = {
    id,
    userId: locator.userId,
    bookId: locator.bookId,
    chapterId: locator.chapterId,
    type: 'bookmark',
    chapterIndex: locator.chapterIndex,
    pageIndex: locator.pageIndex,
    pageNumber: locator.pageNumber,
    pageCount: locator.pageCount,
    percentage: locator.percentage,
    settingsHash: locator.settingsHash,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    syncedAt: undefined,
    deletedAt: undefined,
    dirty: true,
  }

  await db.annotations.put(annotation)
  await enqueueAnnotation(annotation)

  return annotation
}
