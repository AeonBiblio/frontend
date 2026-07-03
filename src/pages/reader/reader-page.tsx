import { getRouteApi, useNavigate } from '@tanstack/react-router'
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Helmet } from 'react-helmet-async'

import {
  useBookAccessQuery,
  useBookQuery,
  usePrefetchReaderChaptersMutation,
  useReaderChapterQuery,
  useReaderManifestQuery,
  useReaderTocQuery,
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
import { loadReadingProgress } from '@modules/reader/api/progress-sync'
import { DEFAULT_READER_DISPLAY_SETTINGS } from '@modules/reader/model/display-settings'
import { ChapterContent } from './components/chapter-content'
import { ReaderBookmarksPanel } from './components/reader-bookmarks-panel'
import { ReaderHeader } from './components/reader-header'
import { ReaderSettingsPanel } from './components/reader-settings-panel'
import { ReaderTocPanel } from './components/reader-toc-panel'

import styles from './reader-page.module.scss'

import type { ReaderManifestChapter } from '@shared/api/core'
import type { LocalAnnotation } from '@shared/lib/db'
import type { ReaderBookmarkLocator } from '@modules/reader/api/bookmark-sync'
import type { ReaderDisplaySettings } from '@modules/reader/model/display-settings'
import type { ReaderTocEntry } from './components/reader-toc-panel'

const readerRoute = getRouteApi('/reader/$bookId')

const PdfReader = lazy(() =>
  import('./components/pdf-reader').then((module) => ({
    default: module.PdfReader,
  })),
)

type ReaderBookmarkJumpRequest = {
  bookmark: LocalAnnotation
  requestId: number
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

function ChapterReader({
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
}: {
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
}) {
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
          isHudHidden={isHudHidden}
          manifest={manifest}
          onHideHud={onHideHud}
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
}

export function ReaderPage() {
  const { bookId } = readerRoute.useParams()
  const navigate = useNavigate()
  const bookQuery = useBookQuery(bookId)
  const accessQuery = useBookAccessQuery(bookId)
  const sessionQuery = useSessionQuery()
  const book = bookQuery.data
  const canRead = accessQuery.data?.can_read
  const routeUser = readerRoute.useRouteContext().user
  const user = sessionQuery.data ?? routeUser
  const userId = user?.id
  const [pageLocator, setPageLocator] = useState<ReaderBookmarkLocator | null>(
    null,
  )
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
  const skipNextSettingsSaveRef = useRef(false)

  const goBack = useCallback(() => {
    void navigate({ to: '/books/$bookId', params: { bookId } })
  }, [bookId, navigate])

  const handlePageLocatorChange = useCallback(
    (locator: ReaderBookmarkLocator) => {
      setPageLocator(locator)
    },
    [],
  )

  useEffect(() => {
    let disposed = false

    async function loadBookmark() {
      if (!pageLocator) {
        setIsBookmarked(false)
        return
      }

      const bookmark = await getReaderBookmark(pageLocator)

      if (!disposed) {
        setIsBookmarked(Boolean(bookmark))
      }
    }

    void loadBookmark()

    return () => {
      disposed = true
    }
  }, [pageLocator])

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

    void saveReaderDisplaySettings({
      bookId,
      settings: readerSettings,
      userId,
    })
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
  }, [isBookmarked, pageLocator, refreshBookmarks])

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
          settings={readerSettings}
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
            settings={readerSettings}
            userId={user.id}
          />
        </Suspense>
      ) : (
        <p className={styles.state}>Этот формат пока не поддерживается.</p>
      )}
    </main>
  )
}
