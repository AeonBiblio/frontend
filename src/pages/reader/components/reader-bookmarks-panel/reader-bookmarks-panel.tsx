import styles from './reader-bookmarks-panel.module.scss'

import type { LocalAnnotation } from '@shared/lib/db'

type ReaderBookmarksPanelProps = {
  bookmarks: LocalAnnotation[]
  onSelectBookmark: (bookmark: LocalAnnotation) => void
}

function formatBookmarkLocation(bookmark: LocalAnnotation) {
  if (bookmark.chapterId.startsWith('pdf:')) {
    return `PDF · Стр. ${bookmark.pageNumber ?? 1}`
  }

  return `Глава ${bookmark.chapterIndex === undefined ? '' : bookmark.chapterIndex + 1} · Стр. ${
    (bookmark.pageIndex ?? 0) + 1
  }`
}

export function ReaderBookmarksPanel({
  bookmarks,
  onSelectBookmark,
}: ReaderBookmarksPanelProps) {
  const sortedBookmarks = [...bookmarks].sort((a, b) => {
    if (a.chapterId !== b.chapterId) {
      return a.chapterId.localeCompare(b.chapterId)
    }

    return (
      (a.pageIndex ?? a.pageNumber ?? 0) - (b.pageIndex ?? b.pageNumber ?? 0)
    )
  })

  return (
    <aside className={styles.panel} aria-label="Закладки">
      <h2 className={styles.title}>Закладки</h2>

      {sortedBookmarks.length === 0 ? (
        <p className={styles.empty}>В этой книге пока нет закладок.</p>
      ) : (
        <ol className={styles.list}>
          {sortedBookmarks.map((bookmark) => (
            <li className={styles.item} key={bookmark.id}>
              <button
                className={styles.bookmarkButton}
                type="button"
                onClick={() => onSelectBookmark(bookmark)}
              >
                <span className={styles.location}>
                  {formatBookmarkLocation(bookmark)}
                </span>
                <span className={styles.date}>
                  {new Date(bookmark.updatedAt).toLocaleDateString('ru-RU')}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </aside>
  )
}
