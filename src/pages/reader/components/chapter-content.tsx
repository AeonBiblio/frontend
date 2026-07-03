import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { db } from '@shared/lib/db'
import { saveReadingProgress } from '@modules/reader/api/progress-sync'
import { ReadingProgressBar } from './reading-progress-bar'

import styles from '../reader-page.module.scss'

import type { ReaderChapter, ReaderManifest } from '@shared/api/core'
import type { LocalAnnotation, LocalBookAsset } from '@shared/lib/db'
import type { ReaderBookmarkLocator } from '@modules/reader/api/bookmark-sync'
import type { ReaderDisplaySettings } from '@modules/reader/model/display-settings'

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
  isHudHidden: boolean
  manifest: ReaderManifest
  onHideHud: () => void
  onPageLocatorChange?: (locator: ReaderBookmarkLocator) => void
  onShowHud: () => void
  settings: ReaderDisplaySettings
  userId: string
}

type ResolvedAsset = {
  asset: LocalBookAsset
  objectUrl: string
}

const ASSET_ATTRS = ['src', 'href', 'xlink:href'] as const
const WHEEL_PAGE_THRESHOLD = 48
const WHEEL_PAGE_LOCK_MS = 420

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return Boolean(
    target.closest('input, textarea, select, button, [contenteditable="true"]'),
  )
}

function normalizeRef(value: string) {
  return decodeURIComponent(value).split('#')[0].split('?')[0]
}

function basename(value: string) {
  return normalizeRef(value).split('/').filter(Boolean).at(-1) ?? value
}

function createAssetMatchers(asset: LocalBookAsset) {
  const values = [asset.id, asset.href, asset.key, asset.url]
    .filter((value): value is string => Boolean(value))
    .map(normalizeRef)

  return new Set([...values, ...values.map(basename)])
}

function resolveAssetUrl(value: string, assets: ResolvedAsset[]) {
  const normalized = normalizeRef(value)
  const normalizedBase = basename(normalized)

  for (const item of assets) {
    const matchers = createAssetMatchers(item.asset)

    if (matchers.has(normalized) || matchers.has(normalizedBase)) {
      return item.objectUrl
    }
  }

  return null
}

function rewriteHtmlAssets(html: string, assets: ResolvedAsset[]) {
  if (assets.length === 0 || typeof window === 'undefined') {
    return html
  }

  const document = new DOMParser().parseFromString(html, 'text/html')

  document
    .querySelectorAll<HTMLElement>('[src], [href], [xlink\\:href]')
    .forEach((node) => {
      ASSET_ATTRS.forEach((attr) => {
        const value = node.getAttribute(attr)

        if (!value) {
          return
        }

        const resolved = resolveAssetUrl(value, assets)

        if (resolved) {
          node.setAttribute(attr, resolved)
        }
      })
    })

  return document.body.innerHTML
}

function createSettingsHash(settings: ReaderDisplaySettings) {
  return [
    settings.fontFamily,
    settings.fontSize,
    settings.fontWeight,
    settings.lineHeight,
    settings.margin,
    settings.columnGap,
    settings.columnsPerPage,
  ].join(':')
}

export function ChapterContent({
  bookId,
  bookmarkJumpRequest,
  chapter,
  chapterIndex,
  chapterTitle,
  fallbackText = 'Глава пуста.',
  isHudHidden,
  manifest,
  onHideHud,
  onPageLocatorChange,
  onShowHud,
  settings,
  userId,
}: ChapterContentProps) {
  const rawHtml = chapter.html ?? chapter.text ?? fallbackText
  const contentRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const restoredProgressKeyRef = useRef<string | null>(null)
  const wheelDeltaRef = useRef(0)
  const wheelLockedUntilRef = useRef(0)
  const [assets, setAssets] = useState<ResolvedAsset[]>([])
  const [pageIndex, setPageIndex] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [pageStep, setPageStep] = useState(1)
  const [columnWidth, setColumnWidth] = useState(1)
  const [columnsPerPage, setColumnsPerPage] = useState(1)
  const [contentMargin, setContentMargin] = useState(settings.margin)
  const [hasMeasuredPages, setHasMeasuredPages] = useState(false)
  const [progressReady, setProgressReady] = useState(false)
  const settingsHash = createSettingsHash(settings)
  const progressKey = `${chapter.id}:${settingsHash}`

  const goPreviousPage = useCallback(() => {
    setPageIndex((value) => Math.max(0, value - 1))
  }, [])

  const goNextPage = useCallback(() => {
    setPageIndex((value) => Math.min(pageCount - 1, value + 1))
  }, [pageCount])

  useEffect(() => {
    let disposed = false
    let objectUrls: string[] = []

    async function loadAssets() {
      const manifestAssets = new Map(
        manifest.assets.map((asset) => [asset.id, asset.href]),
      )
      const localAssets = await db.bookAssets
        .where('[bookId+manifestVersion]')
        .equals([bookId, manifest.version])
        .filter((asset) => chapter.asset_ids.includes(asset.id))
        .toArray()
      const resolved = localAssets
        .filter((asset) => asset.blob)
        .map((asset) => {
          const objectUrl = URL.createObjectURL(asset.blob as Blob)

          return {
            asset: {
              ...asset,
              href: asset.href ?? manifestAssets.get(asset.id),
            },
            objectUrl,
          }
        })

      objectUrls = resolved.map((asset) => asset.objectUrl)

      if (!disposed) {
        setAssets(resolved)
      } else {
        objectUrls.forEach((url) => URL.revokeObjectURL(url))
      }
    }

    void loadAssets()

    return () => {
      disposed = true
      objectUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [bookId, chapter.asset_ids, manifest.assets, manifest.version])

  const html = useMemo(
    () => rewriteHtmlAssets(rawHtml, assets),
    [assets, rawHtml],
  )
  const percentage = pageCount <= 1 ? 100 : (pageIndex / (pageCount - 1)) * 100

  useEffect(() => {
    setPageIndex(0)
    setPageCount(1)
    setHasMeasuredPages(false)
    setProgressReady(false)
    restoredProgressKeyRef.current = null
  }, [progressKey])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current

    if (!viewport || !content) {
      return
    }

    let frameId: number | null = null

    const calculatePages = () => {
      const pageWidth = viewport.clientWidth

      if (pageWidth <= 0) {
        return
      }

      const nextColumnsPerPage =
        pageWidth < 700 ? 1 : Math.max(1, settings.columnsPerPage)
      const nextContentMargin =
        pageWidth < 700
          ? Math.min(settings.margin, 18)
          : Math.min(settings.margin, 42)
      const contentWidth = Math.max(1, pageWidth - nextContentMargin * 2)
      const nextColumnWidth = Math.max(
        1,
        (contentWidth - settings.columnGap * (nextColumnsPerPage - 1)) /
          nextColumnsPerPage,
      )
      const nextPageStep =
        nextColumnsPerPage * (nextColumnWidth + settings.columnGap)
      const nextPageCount = Math.max(
        1,
        Math.ceil(
          Math.max(1, content.scrollWidth - nextContentMargin * 2) /
            nextPageStep,
        ),
      )

      setColumnWidth(nextColumnWidth)
      setColumnsPerPage(nextColumnsPerPage)
      setContentMargin(nextContentMargin)
      setPageStep(nextPageStep)
      setPageCount(nextPageCount)
      setHasMeasuredPages(true)
      setPageIndex((value) => Math.min(value, nextPageCount - 1))
    }

    const scheduleCalculatePages = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }

      frameId = window.requestAnimationFrame(calculatePages)
    }

    scheduleCalculatePages()

    const observer = new ResizeObserver(scheduleCalculatePages)
    const images = Array.from(content.querySelectorAll('img'))

    observer.observe(viewport)
    observer.observe(content)
    images.forEach((image) => {
      image.addEventListener('load', scheduleCalculatePages)
      image.addEventListener('error', scheduleCalculatePages)
    })

    return () => {
      observer.disconnect()
      images.forEach((image) => {
        image.removeEventListener('load', scheduleCalculatePages)
        image.removeEventListener('error', scheduleCalculatePages)
      })
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [html, settings.columnGap, settings.margin, settingsHash])

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

      if (disposed || progress?.chapterId !== chapter.id) {
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
    chapter.id,
    hasMeasuredPages,
    pageCount,
    progressKey,
    settingsHash,
    userId,
  ])

  useEffect(() => {
    if (!hasMeasuredPages) {
      return
    }

    onPageLocatorChange?.({
      bookId,
      chapterId: chapter.id,
      chapterIndex,
      pageIndex,
      pageCount,
      percentage,
      settingsHash,
      userId,
    })
  }, [
    bookId,
    chapter.id,
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

    void saveReadingProgress({
      id: `${userId}:${bookId}`,
      userId,
      bookId,
      chapterId: chapter.id,
      chapterIndex,
      chapterOffset: 0,
      pageIndex,
      pageCount,
      percentage,
      settingsHash,
      updatedAt: new Date().toISOString(),
      dirty: true,
    })
  }, [
    bookId,
    chapter.id,
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
      bookmarkJumpRequest.bookmark.chapterId !== chapter.id
    ) {
      return
    }

    const nextPageIndex =
      bookmarkJumpRequest.bookmark.pageIndex ??
      Math.max(0, (bookmarkJumpRequest.bookmark.pageNumber ?? 1) - 1)

    setPageIndex(
      Math.min(Math.max(0, nextPageIndex), Math.max(0, pageCount - 1)),
    )
  }, [bookmarkJumpRequest, chapter.id, pageCount])

  useEffect(() => {
    if (!settings.enableKeyboardArrows && !settings.enableKeyboardLetters) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isEditableTarget(event.target)) {
        return
      }

      const key = event.key.toLowerCase()

      if (isHudHidden && event.key === 'Escape') {
        event.preventDefault()
        onShowHud()
        return
      }

      const isPreviousArrow =
        settings.enableKeyboardArrows && event.key === 'ArrowLeft'
      const isNextArrow =
        settings.enableKeyboardArrows && event.key === 'ArrowRight'
      const isPreviousLetter = settings.enableKeyboardLetters && key === 'a'
      const isNextLetter = settings.enableKeyboardLetters && key === 'd'

      if (isPreviousArrow || isPreviousLetter) {
        event.preventDefault()
        goPreviousPage()
        return
      }

      if (isNextArrow || isNextLetter) {
        event.preventDefault()
        goNextPage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    goNextPage,
    goPreviousPage,
    isHudHidden,
    onShowHud,
    settings.enableKeyboardArrows,
    settings.enableKeyboardLetters,
  ])

  useEffect(() => {
    const viewport = viewportRef.current

    if (!viewport || !settings.enableWheelNavigation) {
      return
    }

    const handleWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || Math.abs(event.deltaY) < 1) {
        return
      }

      event.preventDefault()

      const now = Date.now()

      if (settings.limitWheelToOnePage && now < wheelLockedUntilRef.current) {
        return
      }

      wheelDeltaRef.current += event.deltaY

      if (Math.abs(wheelDeltaRef.current) < WHEEL_PAGE_THRESHOLD) {
        return
      }

      if (wheelDeltaRef.current > 0) {
        goNextPage()
      } else {
        goPreviousPage()
      }

      wheelDeltaRef.current = 0

      if (settings.limitWheelToOnePage) {
        wheelLockedUntilRef.current = now + WHEEL_PAGE_LOCK_MS
      }
    }

    viewport.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      viewport.removeEventListener('wheel', handleWheel)
      wheelDeltaRef.current = 0
    }
  }, [
    goNextPage,
    goPreviousPage,
    settings.enableWheelNavigation,
    settings.limitWheelToOnePage,
  ])

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
        <h1 className={styles.readerChapterHeading}>{chapterTitle}</h1>
        <div
          className={styles.paginatedChapterContent}
          ref={contentRef}
          style={{
            columnGap: `${settings.columnGap}px`,
            fontFamily: settings.fontFamily,
            fontSize: `${settings.fontSize}px`,
            fontWeight: settings.fontWeight,
            lineHeight: settings.lineHeight,
            columnCount: columnsPerPage,
            columnWidth: `${columnWidth}px`,
            padding: `${contentMargin}px`,
            textAlign: settings.textAlign,
            transform: `translateX(-${pageIndex * pageStep}px)`,
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {settings.enableReaderArrows && !isHudHidden ? (
        <button
          className={`${styles.readerSideButton} ${styles.readerSideButtonNext}`}
          type="button"
          aria-label="Следующая страница"
          disabled={pageIndex >= pageCount - 1}
          onClick={goNextPage}
        >
          ›
        </button>
      ) : null}

      {!isHudHidden ? (
        <ReadingProgressBar
          leftLabel={`Глава ${chapterIndex + 1}   Стр. ${pageIndex + 1} из ${pageCount}`}
          centerLabel="Скрыть HUD"
          onCenterAction={onHideHud}
          percent={percentage}
        />
      ) : null}
    </section>
  )
}
