import { useCallback, useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'

import { downloadPdfToOpfs, isPdfAvailableOffline } from '@modules/books/api'
import { useApiClient } from '@shared/api/runtimeConfig/provider/provider'
import { db } from '@shared/lib/db'
import { getLocalPdfFile } from '@shared/lib/opfs'
import { Spinner } from '@shared/ui/spinner/spinner'
import {
  loadReadingProgress,
  savePdfReadingProgress,
} from '@modules/reader/api/progress-sync'
import { ReadingProgressBar } from './reading-progress-bar'

import styles from '../reader-page.module.scss'

import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { LocalAnnotation } from '@shared/lib/db'
import type { ReaderBookmarkLocator } from '@modules/reader/api/bookmark-sync'
import type { ReaderDisplaySettings } from '@modules/reader/model/display-settings'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

type PdfReaderProps = {
  bookmarkJumpRequest?: {
    bookmark: LocalAnnotation
    requestId: number
  } | null
  bookId: string
  fileSizeBytes?: number | null
  isHudHidden: boolean
  onHideHud: () => void
  onPageLocatorChange?: (locator: ReaderBookmarkLocator) => void
  onShowHud: () => void
  settings: ReaderDisplaySettings
  userId: string
}

type PdfPageCanvasProps = {
  pageNumber: number
  pdf: PDFDocumentProxy
  scale: number
}

async function loadLocalPdfDocument(bookId: string) {
  const file = await getLocalPdfFile(bookId)
  const buffer = await file.arrayBuffer()

  return pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
  }).promise
}

function getRemotePdfUrl(baseURL: string | undefined, bookId: string) {
  return new URL(`/books/${bookId}/content`, baseURL ?? window.location.origin)
    .href
}

async function loadRemotePdfDocument(
  bookId: string,
  baseURL: string | undefined,
) {
  return pdfjsLib.getDocument({
    url: getRemotePdfUrl(baseURL, bookId),
    withCredentials: true,
  }).promise
}

function PdfPageCanvas({ pageNumber, pdf, scale }: PdfPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    let cancelled = false
    let cleanupPage: (() => void) | undefined

    async function renderPage() {
      const canvas = canvasRef.current

      if (!canvas) {
        return
      }

      const page = await pdf.getPage(pageNumber)
      cleanupPage = () => page.cleanup()

      if (cancelled) {
        cleanupPage()
        return
      }

      const viewport = page.getViewport({ scale })
      const context = canvas.getContext('2d')

      if (!context) {
        return
      }

      const outputScale = window.devicePixelRatio || 1

      canvas.width = Math.floor(viewport.width * outputScale)
      canvas.height = Math.floor(viewport.height * outputScale)
      canvas.style.width = `${Math.floor(viewport.width)}px`
      canvas.style.height = `${Math.floor(viewport.height)}px`

      const renderTask = page.render({
        canvas,
        canvasContext: context,
        viewport,
        transform:
          outputScale === 1
            ? undefined
            : [outputScale, 0, 0, outputScale, 0, 0],
      })

      await renderTask.promise
    }

    void renderPage()

    return () => {
      cancelled = true
      cleanupPage?.()
    }
  }, [pageNumber, pdf, scale])

  return <canvas className={styles.pdfCanvas} ref={canvasRef} />
}

export function PdfReader({
  bookmarkJumpRequest,
  bookId,
  fileSizeBytes,
  isHudHidden,
  onHideHud,
  onPageLocatorChange,
  onShowHud,
  settings,
  userId,
}: PdfReaderProps) {
  const client = useApiClient()
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.2)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [source, setSource] = useState<'local' | 'remote' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    let disposed = false
    const controller = new AbortController()

    async function initPdf() {
      setError(null)

      const [savedProgress, readerProgress] = await Promise.all([
        db.pdfProgress.get(bookId),
        loadReadingProgress(userId, bookId),
      ])

      if (!disposed) {
        if (readerProgress?.chapterId === `pdf:${bookId}`) {
          setPageNumber(Math.max(1, (readerProgress.pageIndex ?? 0) + 1))

          const savedScale = readerProgress.settingsHash?.startsWith('pdf:')
            ? Number(readerProgress.settingsHash.replace('pdf:', ''))
            : undefined

          if (savedScale && Number.isFinite(savedScale)) {
            setScale(savedScale)
          }
        } else if (savedProgress) {
          setPageNumber(savedProgress.pageNumber)
          setScale(savedProgress.scale)
        }
      }

      const hasOfflinePdf = await isPdfAvailableOffline(bookId)

      if (hasOfflinePdf) {
        const localPdf = await loadLocalPdfDocument(bookId)

        if (!disposed) {
          setPdf(localPdf)
          setSource('local')
        }

        return
      }

      const remotePdf = await loadRemotePdfDocument(
        bookId,
        client.defaults.baseURL,
      )

      if (!disposed) {
        setPdf(remotePdf)
        setSource('remote')
      }

      if (fileSizeBytes && fileSizeBytes > 0) {
        setIsDownloading(true)
        void downloadPdfToOpfs(client, bookId, fileSizeBytes, {
          signal: controller.signal,
          onProgress: ({ downloadedBytes }) => {
            if (!disposed) {
              setDownloadProgress(downloadedBytes)
            }
          },
        })
          .catch((downloadError) => {
            if (
              !disposed &&
              downloadError instanceof Error &&
              downloadError.name !== 'AbortError'
            ) {
              setError(downloadError.message)
            }
          })
          .finally(() => {
            if (!disposed) {
              setIsDownloading(false)
            }
          })
      }
    }

    void initPdf().catch((loadError) => {
      if (!disposed) {
        setError(
          loadError instanceof Error ? loadError.message : String(loadError),
        )
      }
    })

    return () => {
      disposed = true
      controller.abort()
      pdf?.cleanup()
    }
  }, [bookId, client, fileSizeBytes])

  useEffect(() => {
    if (!pdf) {
      return
    }

    const percentage =
      pdf.numPages <= 1
        ? 100
        : ((pageNumber - 1) / Math.max(1, pdf.numPages - 1)) * 100

    onPageLocatorChange?.({
      bookId,
      chapterId: `pdf:${bookId}`,
      chapterIndex: 0,
      pageIndex: pageNumber - 1,
      pageNumber,
      pageCount: pdf.numPages,
      percentage,
      settingsHash: 'pdf',
      userId,
    })

    void savePdfReadingProgress({
      bookId,
      pageCount: pdf.numPages,
      pageNumber,
      scale,
      userId,
    })
  }, [bookId, onPageLocatorChange, pageNumber, pdf, scale, userId])

  const goPrevious = useCallback(() => {
    setPageNumber((value) => Math.max(1, value - 1))
  }, [])

  const goNext = useCallback(() => {
    if (!pdf) {
      return
    }

    setPageNumber((value) => Math.min(pdf.numPages, value + 1))
  }, [pdf])

  const zoomIn = useCallback(() => {
    setScale((value) => Math.min(2.4, Number((value + 0.1).toFixed(2))))
  }, [])

  const zoomOut = useCallback(() => {
    setScale((value) => Math.max(0.6, Number((value - 0.1).toFixed(2))))
  }, [])

  useEffect(() => {
    if (!bookmarkJumpRequest || !pdf) {
      return
    }

    const bookmark = bookmarkJumpRequest.bookmark

    if (bookmark.chapterId !== `pdf:${bookId}`) {
      return
    }

    const nextPageNumber =
      bookmark.pageNumber ?? Math.max(1, (bookmark.pageIndex ?? 0) + 1)

    setPageNumber(Math.min(Math.max(1, nextPageNumber), pdf.numPages))
  }, [bookmarkJumpRequest, bookId, pdf])

  useEffect(() => {
    if (!settings.enableKeyboardArrows && !settings.enableKeyboardLetters) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target

      if (
        event.defaultPrevented ||
        (target instanceof HTMLElement &&
          target.closest(
            'input, textarea, select, button, [contenteditable="true"]',
          ))
      ) {
        return
      }

      const key = event.key.toLowerCase()
      const isPreviousArrow =
        settings.enableKeyboardArrows && event.key === 'ArrowLeft'
      const isNextArrow =
        settings.enableKeyboardArrows && event.key === 'ArrowRight'
      const isPreviousLetter = settings.enableKeyboardLetters && key === 'a'
      const isNextLetter = settings.enableKeyboardLetters && key === 'd'

      if (isPreviousArrow || isPreviousLetter) {
        event.preventDefault()
        goPrevious()
        return
      }

      if (isNextArrow || isNextLetter) {
        event.preventDefault()
        goNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    goNext,
    goPrevious,
    settings.enableKeyboardArrows,
    settings.enableKeyboardLetters,
  ])

  if (error && !pdf) {
    return <p className={styles.state}>Не удалось открыть PDF: {error}</p>
  }

  if (!pdf) {
    return (
      <p className={styles.state}>
        <Spinner label="Открываем PDF" />
      </p>
    )
  }

  return (
    <article className={styles.reader}>
      {isDownloading && fileSizeBytes ? (
        <p className={styles.downloadStatus}>
          Сохраняем оффлайн: {Math.min(downloadProgress, fileSizeBytes)} /{' '}
          {fileSizeBytes} байт
        </p>
      ) : null}

      {error ? <p className={styles.downloadStatus}>{error}</p> : null}

      <section className={styles.readerSurface} data-hud-hidden={isHudHidden}>
        {settings.enableReaderArrows ? (
          <button
            className={`${styles.readerSideButton} ${styles.readerSideButtonPrev}`}
            type="button"
            aria-label="Предыдущая страница"
            disabled={pageNumber === 1}
            onClick={goPrevious}
          >
            ‹
          </button>
        ) : null}

        {!isHudHidden ? (
          <div className={styles.pdfHud}>
            <span className={styles.pdfMeta}>
              {source === 'local' ? 'Оффлайн-файл' : 'Онлайн PDF'} ·{' '}
              {pageNumber} / {pdf.numPages}
            </span>
            <div className={styles.pdfActions}>
              <button
                className={styles.pdfActionButton}
                type="button"
                onClick={zoomOut}
              >
                -
              </button>
              <span className={styles.pdfScale}>
                {Math.round(scale * 100)}%
              </span>
              <button
                className={styles.pdfActionButton}
                type="button"
                onClick={zoomIn}
              >
                +
              </button>
            </div>
          </div>
        ) : null}

        <div
          className={styles.pdfViewport}
          data-hud-hidden={isHudHidden}
          onClick={() => {
            if (isHudHidden) {
              onShowHud()
            }
          }}
        >
          <PdfPageCanvas pageNumber={pageNumber} pdf={pdf} scale={scale} />
        </div>

        {settings.enableReaderArrows ? (
          <button
            className={`${styles.readerSideButton} ${styles.readerSideButtonNext}`}
            type="button"
            aria-label="Следующая страница"
            disabled={pageNumber >= pdf.numPages}
            onClick={goNext}
          >
            ›
          </button>
        ) : null}

        {!isHudHidden ? (
          <ReadingProgressBar
            leftLabel={`PDF   Стр. ${pageNumber} из ${pdf.numPages}`}
            centerLabel="Скрыть HUD"
            onCenterAction={onHideHud}
            percent={
              pdf.numPages <= 1
                ? 100
                : ((pageNumber - 1) / Math.max(1, pdf.numPages - 1)) * 100
            }
          />
        ) : null}
      </section>
    </article>
  )
}
