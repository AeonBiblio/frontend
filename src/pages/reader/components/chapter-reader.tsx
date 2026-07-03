import { memo, useCallback, useEffect, useMemo, useState } from 'react'

import {
  usePrefetchReaderChaptersMutation,
  useReaderChapterQuery,
  useReaderManifestQuery,
  useReaderTocQuery,
} from '@modules/books/api'
import { loadReadingProgress } from '@modules/reader/api/progress-sync'
import { Spinner } from '@shared/ui/spinner/spinner'
import { ChapterContent } from './chapter-content'
import { ReaderTocPanel } from './reader-toc-panel'

import styles from '../reader-page.module.scss'

import type { ReaderManifestChapter } from '@shared/api/core'
import type { LocalAnnotation } from '@shared/lib/db'
import type { ReaderBookmarkLocator } from '@modules/reader/api/bookmark-sync'
import type { ReaderDisplaySettings } from '@modules/reader/model/display-settings'
import type { ReaderTocEntry } from './reader-toc-panel'

export type ReaderBookmarkJumpRequest = {
  bookmark: LocalAnnotation
  requestId: number
}

type ChapterReaderProps = {
  bookId: string
  bookmarkJumpRequest: ReaderBookmarkJumpRequest | null
  isHudHidden: boolean
  isTocOpen: boolean
  onHideHud: () => void
  onCloseToc: () => void
  onPageLocatorChange: (locator: ReaderBookmarkLocator) => void
  onShowHud: () => void
  settings: ReaderDisplaySettings
  title: string
  userId: string
}

function sortChapters(chapters: ReaderManifestChapter[]) {
  return [...chapters].sort((a, b) => a.index - b.index)
}

function chaptersToTocEntries(
  chapters: ReaderManifestChapter[],
): ReaderTocEntry[] {
  return chapters.map((chapter) => ({
    id: chapter.id,
    chapterId: chapter.id,
    chapterIndex: chapter.index,
    depth: 0,
    order: chapter.index,
    targetKind: 'chapter',
    title: chapter.title ?? `Глава ${chapter.index + 1}`,
  }))
}

export const ChapterReader = memo(function ChapterReaderView({
  bookId,
  bookmarkJumpRequest,
  isHudHidden,
  isTocOpen,
  onHideHud,
  onCloseToc,
  onPageLocatorChange,
  onShowHud,
  settings,
  title,
  userId,
}: ChapterReaderProps) {
  const manifestQuery = useReaderManifestQuery(bookId)
  const prefetchMutation = usePrefetchReaderChaptersMutation(bookId)
  const [chapterIndex, setChapterIndex] = useState(0)
  const [progressHydrated, setProgressHydrated] = useState(false)
  const manifest = manifestQuery.data
  const tocQuery = useReaderTocQuery(bookId, manifest?.version, {
    enabled: Boolean(manifest),
  })

  const chapters = useMemo(
    () => (manifest ? sortChapters(manifest.chapters) : []),
    [manifest],
  )
  const tocItems = useMemo<ReaderTocEntry[]>(() => {
    if (tocQuery.data && tocQuery.data.length > 0) {
      return tocQuery.data.map((item) => ({
        id: item.id,
        chapterId: item.chapterId,
        chapterIndex: item.chapterIndex,
        depth: item.depth,
        order: item.order,
        pageNumber: item.pageNumber,
        targetKind: item.targetKind,
        title: item.title,
      }))
    }

    return chaptersToTocEntries(chapters)
  }, [chapters, tocQuery.data])
  const currentChapter = chapters.at(chapterIndex)
  const chapterQuery = useReaderChapterQuery(bookId, currentChapter?.id ?? '', {
    enabled: Boolean(currentChapter),
  })

  useEffect(() => {
    if (!manifest || manifest.processing_status !== 'ready') {
      return
    }

    if (chapters.length === 0) {
      setProgressHydrated(true)
      return
    }

    let disposed = false

    setProgressHydrated(false)

    async function hydrateProgress() {
      const progress = await loadReadingProgress(userId, bookId)

      if (disposed) {
        return
      }

      if (progress && !progress.chapterId.startsWith('pdf:')) {
        const nextChapterIndex = chapters.findIndex(
          (chapter) =>
            chapter.id === progress.chapterId ||
            chapter.index === progress.chapterIndex,
        )

        if (nextChapterIndex >= 0) {
          setChapterIndex(nextChapterIndex)
        }
      }

      setProgressHydrated(true)
    }

    void hydrateProgress()

    return () => {
      disposed = true
    }
  }, [bookId, chapters, manifest, userId])

  useEffect(() => {
    if (!currentChapter || prefetchMutation.isPending) {
      return
    }

    prefetchMutation.mutate({
      chapterIndex: currentChapter.index,
      windowSize: 3,
      includeAssets: true,
    })
  }, [currentChapter?.id])

  const handleSelectChapter = useCallback(
    (item: ReaderTocEntry) => {
      const nextChapterIndex =
        item.chapterId !== undefined
          ? chapters.findIndex((chapter) => chapter.id === item.chapterId)
          : chapters.findIndex((chapter) => chapter.index === item.chapterIndex)

      if (nextChapterIndex < 0) {
        return
      }

      setChapterIndex(nextChapterIndex)
      onCloseToc()
    },
    [chapters, onCloseToc],
  )

  const handleNextChapter = useCallback(() => {
    setChapterIndex((value) =>
      Math.min(value + 1, Math.max(0, chapters.length - 1)),
    )
  }, [chapters.length])

  useEffect(() => {
    if (!bookmarkJumpRequest) {
      return
    }

    const bookmark = bookmarkJumpRequest.bookmark

    if (bookmark.chapterId.startsWith('pdf:')) {
      return
    }

    const nextChapterIndex = chapters.findIndex(
      (chapter) =>
        chapter.id === bookmark.chapterId ||
        chapter.index === bookmark.chapterIndex,
    )

    if (nextChapterIndex >= 0) {
      setChapterIndex(nextChapterIndex)
      onCloseToc()
    }
  }, [bookmarkJumpRequest, chapters, onCloseToc])

  if (manifestQuery.isLoading) {
    return (
      <p className={styles.state}>
        <Spinner label="Загружаем содержание" />
      </p>
    )
  }

  if (manifestQuery.isError) {
    return (
      <p className={styles.state}>
        Не удалось загрузить книгу. Проверьте подключение или попробуйте позже.
      </p>
    )
  }

  if (!manifest || manifest.processing_status !== 'ready') {
    return (
      <p className={styles.state}>
        Книга ещё обрабатывается и пока недоступна для чтения.
      </p>
    )
  }

  if (!progressHydrated) {
    return (
      <p className={styles.state}>
        <Spinner label="Восстанавливаем прогресс" />
      </p>
    )
  }

  if (!currentChapter) {
    return <p className={styles.state}>В книге нет доступных глав.</p>
  }

  return (
    <article className={styles.reader}>
      {isTocOpen ? (
        <ReaderTocPanel
          currentChapterId={currentChapter.id}
          currentChapterIndex={currentChapter.index}
          items={tocItems}
          onSelectItem={handleSelectChapter}
        />
      ) : null}

      {chapterQuery.isLoading ? (
        <p className={styles.state}>
          <Spinner label="Загружаем главу" />
        </p>
      ) : chapterQuery.isError ? (
        <p className={styles.state}>Не удалось открыть главу.</p>
      ) : chapterQuery.data ? (
        <ChapterContent
          bookId={bookId}
          bookmarkJumpRequest={bookmarkJumpRequest}
          chapter={chapterQuery.data}
          chapterIndex={chapterIndex}
          chapterTitle={currentChapter.title ?? title}
          hasNextChapter={chapterIndex < chapters.length - 1}
          isHudHidden={isHudHidden}
          manifest={manifest}
          onHideHud={onHideHud}
          onNextChapter={handleNextChapter}
          onPageLocatorChange={onPageLocatorChange}
          onShowHud={onShowHud}
          settings={settings}
          userId={userId}
        />
      ) : (
        <p className={styles.state}>Глава пуста.</p>
      )}
    </article>
  )
})
