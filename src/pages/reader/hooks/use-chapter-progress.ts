import { useEffect, useRef, useState } from 'react'

import { saveReadingProgress } from '@modules/reader/api/progress-sync'
import { db } from '@shared/lib/db'

import type { LocalAnnotation } from '@shared/lib/db'
import type { ReaderBookmarkLocator } from '@modules/reader/api/bookmark-sync'

const READER_PROGRESS_SAVE_DELAY_MS = 450

type BookmarkJumpRequest = {
  bookmark: LocalAnnotation
  requestId: number
} | null

type UseChapterProgressParams = {
  bookId: string
  bookmarkJumpRequest?: BookmarkJumpRequest
  chapterId: string
  chapterIndex: number
  hasMeasuredPages: boolean
  onPageLocatorChange?: (locator: ReaderBookmarkLocator) => void
  pageCount: number
  pageIndex: number
  pagesPerSpread: number
  percentage: number
  progressKey: string
  setPageIndex: (updater: number | ((value: number) => number)) => void
  settingsHash: string
  userId: string
}

export function useChapterProgress({
  bookId,
  bookmarkJumpRequest,
  chapterId,
  chapterIndex,
  hasMeasuredPages,
  onPageLocatorChange,
  pageCount,
  pageIndex,
  pagesPerSpread,
  percentage,
  progressKey,
  setPageIndex,
  settingsHash,
  userId,
}: UseChapterProgressParams) {
  const restoredProgressKeyRef = useRef<string | null>(null)
  const progressSaveTimerRef = useRef<number | null>(null)
  const [progressReady, setProgressReady] = useState(false)

  useEffect(() => {
    setProgressReady(false)
    restoredProgressKeyRef.current = null
  }, [progressKey])

  useEffect(() => {
    let disposed = false

    async function restoreProgress() {
      if (!hasMeasuredPages) {
        return
      }

      if (restoredProgressKeyRef.current === progressKey) {
        return
      }

      const progress = await db.readingProgress
        .where('[userId+bookId]')
        .equals([userId, bookId])
        .first()

      if (disposed || progress?.chapterId !== chapterId) {
        restoredProgressKeyRef.current = progressKey
        setPageIndex(0)
        setProgressReady(true)
        return
      }

      if (
        progress.settingsHash === settingsHash &&
        progress.pageIndex !== undefined
      ) {
        restoredProgressKeyRef.current = progressKey
        setPageIndex(Math.min(progress.pageIndex, Math.max(0, pageCount - 1)))
        setProgressReady(true)
        return
      }

      restoredProgressKeyRef.current = progressKey
      setPageIndex(
        Math.min(
          Math.floor((progress.percentage / 100) * pageCount),
          Math.max(0, pageCount - 1),
        ),
      )
      setProgressReady(true)
    }

    void restoreProgress()

    return () => {
      disposed = true
    }
  }, [
    bookId,
    chapterId,
    hasMeasuredPages,
    pageCount,
    progressKey,
    setPageIndex,
    settingsHash,
    userId,
  ])

  useEffect(() => {
    if (!hasMeasuredPages) {
      return
    }

    onPageLocatorChange?.({
      bookId,
      chapterId,
      chapterIndex,
      pageIndex,
      pageCount,
      percentage,
      settingsHash,
      userId,
    })
  }, [
    bookId,
    chapterId,
    chapterIndex,
    hasMeasuredPages,
    onPageLocatorChange,
    pageCount,
    pageIndex,
    percentage,
    settingsHash,
    userId,
  ])

  useEffect(() => {
    if (!progressReady) {
      return
    }

    if (progressSaveTimerRef.current !== null) {
      window.clearTimeout(progressSaveTimerRef.current)
    }

    const progress = {
      id: `${userId}:${bookId}`,
      userId,
      bookId,
      chapterId,
      chapterIndex,
      chapterOffset: 0,
      pageIndex,
      pageCount,
      percentage,
      settingsHash,
      updatedAt: new Date().toISOString(),
      dirty: true,
    }
    const timer = window.setTimeout(() => {
      progressSaveTimerRef.current = null
      void saveReadingProgress(progress)
    }, READER_PROGRESS_SAVE_DELAY_MS)

    progressSaveTimerRef.current = timer

    return () => {
      window.clearTimeout(timer)

      if (progressSaveTimerRef.current === timer) {
        progressSaveTimerRef.current = null
      }
    }
  }, [
    bookId,
    chapterId,
    chapterIndex,
    pageCount,
    pageIndex,
    percentage,
    progressReady,
    settingsHash,
    userId,
  ])

  useEffect(() => {
    if (
      !bookmarkJumpRequest ||
      bookmarkJumpRequest.bookmark.chapterId !== chapterId
    ) {
      return
    }

    const nextPageIndex =
      bookmarkJumpRequest.bookmark.pageIndex ??
      Math.max(0, (bookmarkJumpRequest.bookmark.pageNumber ?? 1) - 1)

    const nextSpreadIndex =
      pagesPerSpread === 2 ? nextPageIndex - (nextPageIndex % 2) : nextPageIndex

    setPageIndex(
      Math.min(Math.max(0, nextSpreadIndex), Math.max(0, pageCount - 1)),
    )
  }, [bookmarkJumpRequest, chapterId, pageCount, pagesPerSpread, setPageIndex])
}
