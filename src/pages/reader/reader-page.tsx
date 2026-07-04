import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  lazy,
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Helmet } from 'react-helmet-async'

import {
  useBookAccessQuery,
  useBookQuery,
  usePrefetchReaderChaptersMutation,
} from '@modules/books/api'
import { useSessionQuery } from '@shared/api/auth'
import { Spinner } from '@shared/ui/spinner/spinner'
import {
  getReaderBookmark,
  getReaderBookmarks,
  setReaderBookmark,
} from '@modules/reader/api/bookmark-sync'
import {
  loadReaderDisplaySettings,
  saveReaderDisplaySettings,
} from '@modules/reader/api/settings-sync'
import { DEFAULT_READER_DISPLAY_SETTINGS } from '@domain/reader/display-settings'
import { ChapterReader } from './components/chapter-reader'
import { ReaderBookmarksPanel } from './components/reader-bookmarks-panel'
import { ReaderHeader } from './components/reader-header'
import { ReaderSettingsPanel } from './components/reader-settings-panel'
import { ReaderTocPanel } from './components/reader-toc-panel'

import styles from './reader-page.module.scss'

import type { LocalAnnotation } from '@shared/lib/db'
import type { ReaderBookmarkLocator } from '@modules/reader/api/bookmark-sync'
import type { ReaderBookmarkJumpRequest } from './components/chapter-reader'
import type { ReaderDownloadAllState } from './components/reader-settings-panel'

const readerRoute = getRouteApi('/reader/$bookId')
const READER_SETTINGS_SAVE_DELAY_MS = 500
const READER_BOOKMARK_CHECK_DELAY_MS = 250

const PdfReader = lazy(() =>
  import('./components/pdf-reader').then((module) => ({
    default: module.PdfReader,
  })),
)

export function ReaderPage() {
  const { bookId } = readerRoute.useParams()
  const navigate = useNavigate()
  const bookQuery = useBookQuery(bookId)
  const accessQuery = useBookAccessQuery(bookId)
  const prefetchReaderBookMutation = usePrefetchReaderChaptersMutation(bookId)
  const sessionQuery = useSessionQuery()
  const book = bookQuery.data
  const canRead = accessQuery.data?.can_read
  const isTextBook = book?.file_format === 'epub' || book?.file_format === 'fb2'
  const isReaderBookDownloadPending = prefetchReaderBookMutation.isPending
  const routeUser = readerRoute.useRouteContext().user
  const user = sessionQuery.data ?? routeUser
  const userId = user?.id
  const [bookmarks, setBookmarks] = useState<LocalAnnotation[]>([])
  const [bookmarkJumpRequest, setBookmarkJumpRequest] =
    useState<ReaderBookmarkJumpRequest | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false)
  const [isHudHidden, setIsHudHidden] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isTocOpen, setIsTocOpen] = useState(false)
  const [readerSettings, setReaderSettings] = useState(
    DEFAULT_READER_DISPLAY_SETTINGS,
  )
  const [settingsReady, setSettingsReady] = useState(false)
  const loadedSettingsKeyRef = useRef<string | null>(null)
  const pageLocatorRef = useRef<ReaderBookmarkLocator | null>(null)
  const bookmarkCheckTimerRef = useRef<number | null>(null)
  const skipNextSettingsSaveRef = useRef(false)
  const settingsSaveTimerRef = useRef<number | null>(null)
  const deferredReaderSettings = useDeferredValue(readerSettings)

  const goBack = useCallback(() => {
    void navigate({ to: '/books/$bookId', params: { bookId } })
  }, [bookId, navigate])

  const handlePageLocatorChange = useCallback(
    (locator: ReaderBookmarkLocator) => {
      pageLocatorRef.current = locator

      if (bookmarkCheckTimerRef.current !== null) {
        window.clearTimeout(bookmarkCheckTimerRef.current)
      }

      const timer = window.setTimeout(() => {
        bookmarkCheckTimerRef.current = null
        void getReaderBookmark(locator).then((bookmark) => {
          if (pageLocatorRef.current === locator) {
            setIsBookmarked(Boolean(bookmark))
          }
        })
      }, READER_BOOKMARK_CHECK_DELAY_MS)

      bookmarkCheckTimerRef.current = timer
    },
    [],
  )

  useEffect(() => {
    return () => {
      if (bookmarkCheckTimerRef.current !== null) {
        window.clearTimeout(bookmarkCheckTimerRef.current)
        bookmarkCheckTimerRef.current = null
      }
    }
  }, [])

  const refreshBookmarks = useCallback(async () => {
    if (!userId) {
      setBookmarks([])
      return
    }

    const nextBookmarks = await getReaderBookmarks(bookId, userId)

    setBookmarks(nextBookmarks)
  }, [bookId, userId])

  useEffect(() => {
    void refreshBookmarks()
  }, [refreshBookmarks])

  useEffect(() => {
    if (!userId) {
      return
    }

    let disposed = false
    const safeUserId = userId
    const settingsKey = `${safeUserId}:${bookId}`

    setSettingsReady(false)

    async function loadSettings() {
      const storedSettings = await loadReaderDisplaySettings(safeUserId, bookId)

      if (disposed) {
        return
      }

      skipNextSettingsSaveRef.current = true
      loadedSettingsKeyRef.current = settingsKey
      setReaderSettings(storedSettings ?? DEFAULT_READER_DISPLAY_SETTINGS)
      setSettingsReady(true)
    }

    void loadSettings()

    return () => {
      disposed = true
    }
  }, [bookId, userId])

  useEffect(() => {
    if (!userId || !settingsReady) {
      return
    }

    const settingsKey = `${userId}:${bookId}`

    if (loadedSettingsKeyRef.current !== settingsKey) {
      return
    }

    if (skipNextSettingsSaveRef.current) {
      skipNextSettingsSaveRef.current = false
      return
    }

    if (settingsSaveTimerRef.current !== null) {
      window.clearTimeout(settingsSaveTimerRef.current)
    }

    const timer = window.setTimeout(() => {
      settingsSaveTimerRef.current = null
      void saveReaderDisplaySettings({
        bookId,
        settings: readerSettings,
        userId,
      })
    }, READER_SETTINGS_SAVE_DELAY_MS)

    settingsSaveTimerRef.current = timer

    return () => {
      window.clearTimeout(timer)

      if (settingsSaveTimerRef.current === timer) {
        settingsSaveTimerRef.current = null
      }
    }
  }, [bookId, readerSettings, settingsReady, userId])

  useEffect(() => {
    if (!isHudHidden) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsHudHidden(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isHudHidden])

  useEffect(() => {
    if (!sessionQuery.isError) {
      return
    }

    void navigate({ to: '/login' })
  }, [navigate, sessionQuery.isError])

  const handleToggleBookmark = useCallback(() => {
    const pageLocator = pageLocatorRef.current

    if (!pageLocator) {
      return
    }

    const nextValue = !isBookmarked
    setIsBookmarked(nextValue)
    void setReaderBookmark(pageLocator, nextValue)
      .then(refreshBookmarks)
      .catch(() => {
        setIsBookmarked(!nextValue)
      })
  }, [isBookmarked, refreshBookmarks])

  const handleSelectBookmark = useCallback((bookmark: LocalAnnotation) => {
    setBookmarkJumpRequest({
      bookmark,
      requestId: Date.now(),
    })
    setIsBookmarksOpen(false)
    setIsHudHidden(false)
  }, [])

  const handleHideHud = useCallback(() => {
    setIsBookmarksOpen(false)
    setIsSettingsOpen(false)
    setIsTocOpen(false)
    setIsHudHidden(true)
  }, [])

  const handleShowHud = useCallback(() => {
    setIsHudHidden(false)
  }, [])

  const handleToggleSettings = useCallback(() => {
    setIsHudHidden(false)
    setIsBookmarksOpen(false)
    setIsTocOpen(false)
    setIsSettingsOpen((value) => !value)
  }, [])

  const handleToggleToc = useCallback(() => {
    setIsHudHidden(false)
    setIsBookmarksOpen(false)
    setIsSettingsOpen(false)
    setIsTocOpen((value) => !value)
  }, [])

  const handleToggleBookmarks = useCallback(() => {
    setIsHudHidden(false)
    setIsSettingsOpen(false)
    setIsTocOpen(false)
    setIsBookmarksOpen((value) => !value)
    void refreshBookmarks()
  }, [refreshBookmarks])

  const handleCloseToc = useCallback(() => {
    setIsTocOpen(false)
  }, [])

  const handleDownloadAllReaderContent = useCallback(() => {
    if (!isTextBook || isReaderBookDownloadPending) {
      return
    }

    prefetchReaderBookMutation.mutate({
      chapterIndex: 0,
      windowSize: Number.MAX_SAFE_INTEGER,
      includeAssets: true,
    })
  }, [isReaderBookDownloadPending, isTextBook, prefetchReaderBookMutation])

  const downloadAllState: ReaderDownloadAllState =
    prefetchReaderBookMutation.isPending
      ? 'pending'
      : prefetchReaderBookMutation.isSuccess
        ? 'success'
        : prefetchReaderBookMutation.isError
          ? 'error'
          : 'idle'

  if (bookQuery.isLoading || sessionQuery.isLoading || accessQuery.isLoading) {
    return (
      <main className={styles.page}>
        <p className={styles.state}>
          <Spinner label="Открываем книгу" />
        </p>
      </main>
    )
  }

  if (!book) {
    return (
      <main className={styles.page}>
        <p className={styles.state}>Книга не найдена.</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className={styles.page}>
        <p className={styles.state}>
          <Spinner label="Проверяем доступ" />
        </p>
      </main>
    )
  }

  return (
    <main
      className={styles.page}
      data-hud-hidden={isHudHidden}
      data-reader-theme={readerSettings.colorTheme}
    >
      <Helmet>
        <title>{book.title}</title>
      </Helmet>

      {!isHudHidden ? (
        <ReaderHeader
          isBookmarked={isBookmarked}
          isBookmarksOpen={isBookmarksOpen}
          isSettingsOpen={isSettingsOpen}
          isTocOpen={isTocOpen}
          onBack={goBack}
          onToggleBookmarks={handleToggleBookmarks}
          onToggleToc={handleToggleToc}
          onToggleSettings={handleToggleSettings}
          onToggleBookmark={handleToggleBookmark}
        />
      ) : null}

      {isSettingsOpen && !isHudHidden ? (
        <ReaderSettingsPanel
          downloadAllState={downloadAllState}
          settings={readerSettings}
          onDownloadAll={
            canRead && isTextBook ? handleDownloadAllReaderContent : undefined
          }
          onChange={setReaderSettings}
        />
      ) : null}

      {isBookmarksOpen && !isHudHidden ? (
        <ReaderBookmarksPanel
          bookmarks={bookmarks}
          onSelectBookmark={handleSelectBookmark}
        />
      ) : null}

      {isTocOpen && !isHudHidden && book.file_format === 'pdf' ? (
        <ReaderTocPanel
          items={[]}
          currentChapterIndex={0}
          emptyText="Оглавление PDF пока недоступно."
          onSelectItem={handleCloseToc}
        />
      ) : null}

      {!canRead ? (
        <p className={styles.state}>У вас нет доступа к чтению этой книги.</p>
      ) : book.file_format === 'epub' || book.file_format === 'fb2' ? (
        <ChapterReader
          bookId={bookId}
          bookmarkJumpRequest={bookmarkJumpRequest}
          isHudHidden={isHudHidden}
          isTocOpen={isTocOpen}
          onHideHud={handleHideHud}
          onCloseToc={handleCloseToc}
          onPageLocatorChange={handlePageLocatorChange}
          onShowHud={handleShowHud}
          settings={readerSettings}
          title={book.title}
          userId={user.id}
        />
      ) : book.file_format === 'pdf' ? (
        <Suspense
          fallback={
            <p className={styles.state}>
              <Spinner label="Открываем PDF" />
            </p>
          }
        >
          <PdfReader
            bookmarkJumpRequest={bookmarkJumpRequest}
            bookId={bookId}
            fileSizeBytes={
              accessQuery.data?.file_size_bytes ?? book.file_size_bytes
            }
            isHudHidden={isHudHidden}
            onHideHud={handleHideHud}
            onPageLocatorChange={handlePageLocatorChange}
            onShowHud={handleShowHud}
            settings={deferredReaderSettings}
            userId={user.id}
          />
        </Suspense>
      ) : (
        <p className={styles.state}>Этот формат пока не поддерживается.</p>
      )}
    </main>
  )
}
