import { useCallback, useMemo, useRef } from 'react'

import { createSettingsHash, sanitizeChapterHtml } from '../lib/chapter-html'
import { isEditableTarget } from '../lib/is-editable-target'
import { useChapterPagination } from '../hooks/use-chapter-pagination'
import { useChapterProgress } from '../hooks/use-chapter-progress'
import { useReaderInputNavigation } from '../hooks/use-reader-input-navigation'
import { ReadingProgressBar } from './reading-progress-bar'

import styles from '../reader-page.module.scss'

import type { ReaderChapter } from '@shared/api/core'
import type { LocalAnnotation } from '@shared/lib/db'
import type { ReaderBookmarkLocator } from '@modules/reader/api/bookmark-sync'
import type { ReaderDisplaySettings } from '@modules/reader/model/display-settings'

const PAGE_VERTICAL_PADDING_EXTRA = 5

type ChapterContentProps = {
  bookId: string
  bookmarkJumpRequest?: {
    bookmark: LocalAnnotation
    requestId: number
  } | null
  chapter: ReaderChapter
  chapterIndex: number
  chapterTitle: string
  fallbackText?: string
  hasNextChapter: boolean
  isHudHidden: boolean
  onHideHud: () => void
  onNextChapter: () => void
  onPageLocatorChange?: (locator: ReaderBookmarkLocator) => void
  onShowHud: () => void
  settings: ReaderDisplaySettings
  userId: string
}

export function ChapterContent({
  bookId,
  bookmarkJumpRequest,
  chapter,
  chapterIndex,
  chapterTitle,
  fallbackText = 'Глава пуста.',
  hasNextChapter,
  isHudHidden,
  onHideHud,
  onNextChapter,
  onPageLocatorChange,
  onShowHud,
  settings,
  userId,
}: ChapterContentProps) {
  const rawHtml = chapter.html ?? chapter.text ?? fallbackText
  const contentRef = useRef<HTMLDivElement | null>(null)
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const settingsHash = createSettingsHash(settings)
  const progressKey = `${chapter.id}:${settingsHash}`
  const html = useMemo(() => sanitizeChapterHtml(rawHtml), [rawHtml])
  const {
    contentMargin,
    hasMeasuredPages,
    isAtLastSpread,
    measureHtml,
    pageCount,
    pageIndex,
    pagesPerSpread,
    percentage,
    setPageIndex,
    visiblePages,
  } = useChapterPagination({
    headingRef,
    html,
    measureRef,
    progressKey,
    settings,
    viewportRef,
  })
  const pagePadding = `${contentMargin + PAGE_VERTICAL_PADDING_EXTRA}px ${contentMargin}px`

  const goPreviousPage = useCallback(() => {
    setPageIndex((value) => Math.max(0, value - pagesPerSpread))
  }, [pagesPerSpread])

  const goNextPage = useCallback(() => {
    const nextPageIndex = pageIndex + pagesPerSpread

    if (hasMeasuredPages && nextPageIndex >= pageCount) {
      if (hasNextChapter) {
        onNextChapter()
      }

      return
    }

    setPageIndex(Math.min(pageCount - 1, nextPageIndex))
  }, [
    hasMeasuredPages,
    hasNextChapter,
    onNextChapter,
    pageCount,
    pageIndex,
    pagesPerSpread,
  ])

  useChapterProgress({
    bookId,
    bookmarkJumpRequest,
    chapterId: chapter.id,
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
  })

  useReaderInputNavigation({
    goNextPage,
    goPreviousPage,
    isHudHidden,
    onShowHud,
    settings,
    viewportRef,
  })

  return (
    <section
      className={styles.readerSurface}
      data-hud-hidden={isHudHidden}
      onClickCapture={(event) => {
        if (!isHudHidden || isEditableTarget(event.target)) {
          return
        }

        onShowHud()
      }}
    >
      {settings.enableReaderArrows && !isHudHidden ? (
        <button
          className={`${styles.readerSideButton} ${styles.readerSideButtonPrev}`}
          type="button"
          aria-label="Предыдущая страница"
          disabled={pageIndex === 0}
          onClick={goPreviousPage}
        >
          ‹
        </button>
      ) : null}

      <div className={styles.pageReaderViewport} ref={viewportRef}>
        <h1 className={styles.readerChapterHeading} ref={headingRef}>
          {chapterTitle}
        </h1>
        <div
          className={styles.paginatedChapterSpread}
          data-pages-per-spread={pagesPerSpread}
          ref={contentRef}
          style={{
            gap: `${settings.columnGap}px`,
          }}
        >
          {visiblePages.map((pageHtml, visiblePageIndex) => (
            <div
              className={styles.paginatedChapterContent}
              key={pageIndex + visiblePageIndex}
              style={{
                fontFamily: settings.fontFamily,
                fontSize: `${settings.fontSize}px`,
                fontWeight: settings.fontWeight,
                lineHeight: settings.lineHeight,
                padding: pagePadding,
                textAlign: settings.textAlign,
              }}
              dangerouslySetInnerHTML={{ __html: pageHtml }}
            />
          ))}
        </div>
        {!hasMeasuredPages ? (
          <div
            aria-hidden="true"
            className={`${styles.paginatedChapterContent} ${styles.paginatedChapterMeasure}`}
            ref={measureRef}
            style={{
              fontFamily: settings.fontFamily,
              fontSize: `${settings.fontSize}px`,
              fontWeight: settings.fontWeight,
              lineHeight: settings.lineHeight,
              padding: pagePadding,
              textAlign: settings.textAlign,
            }}
            dangerouslySetInnerHTML={{ __html: measureHtml }}
          />
        ) : null}
      </div>

      {settings.enableReaderArrows && !isHudHidden ? (
        <button
          className={`${styles.readerSideButton} ${styles.readerSideButtonNext}`}
          type="button"
          aria-label="Следующая страница"
          disabled={!hasNextChapter && isAtLastSpread}
          onClick={goNextPage}
        >
          ›
        </button>
      ) : null}

      {!isHudHidden ? (
        <ReadingProgressBar
          leftLabel={
            pagesPerSpread === 2 && pageIndex + 1 < pageCount
              ? `Глава ${chapterIndex + 1}   Стр. ${pageIndex + 1}-${pageIndex + 2} из ${pageCount}`
              : `Глава ${chapterIndex + 1}   Стр. ${pageIndex + 1} из ${pageCount}`
          }
          centerLabel="Скрыть HUD"
          onCenterAction={onHideHud}
          percent={percentage}
        />
      ) : null}
    </section>
  )
}
