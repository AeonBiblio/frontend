import bookIconUrl from '@shared/assets/icons/reader-book.svg'
import bookmarkIconUrl from '@shared/assets/icons/reader-bookmark.svg'
import settingsIconUrl from '@shared/assets/icons/reader-settings.svg'
import tocIconUrl from '@shared/assets/icons/reader-toc.svg'

import styles from './reader-header.module.scss'

import type { CSSProperties } from 'react'

type ReaderHeaderProps = {
  isBookmarked: boolean
  isBookmarksOpen: boolean
  isSettingsOpen: boolean
  isTocOpen: boolean
  onBack: () => void
  onToggleBookmarks: () => void
  onToggleToc: () => void
  onToggleSettings: () => void
  onToggleBookmark: () => void
}

function iconStyle(url: string): CSSProperties {
  return { '--icon-url': `url("${url}")` } as CSSProperties
}

export function ReaderHeader({
  isBookmarked,
  isBookmarksOpen,
  isSettingsOpen,
  isTocOpen,
  onBack,
  onToggleBookmarks,
  onToggleToc,
  onToggleSettings,
  onToggleBookmark,
}: ReaderHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.group}>
        <button
          className={styles.iconButton}
          type="button"
          aria-label="Вернуться к книге"
          onClick={onBack}
        >
          <span className={styles.backIcon} aria-hidden="true" />
        </button>
        <button
          className={styles.iconButton}
          type="button"
          aria-label="Закладки"
          aria-pressed={isBookmarksOpen}
          onClick={onToggleBookmarks}
        >
          <span
            className={styles.icon}
            style={iconStyle(bookIconUrl)}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className={styles.group}>
        <button
          className={`${styles.iconButton} ${styles.bookmarkButton}`}
          type="button"
          aria-label={
            isBookmarked
              ? 'Удалить страницу из закладок'
              : 'Добавить страницу в закладки'
          }
          aria-pressed={isBookmarked}
          onClick={onToggleBookmark}
        >
          <span
            className={styles.bookmarkIcon}
            style={iconStyle(bookmarkIconUrl)}
            aria-hidden="true"
          />
        </button>
        <button
          className={styles.iconButton}
          type="button"
          aria-label="Оглавление"
          aria-pressed={isTocOpen}
          onClick={onToggleToc}
        >
          <span
            className={styles.icon}
            style={iconStyle(tocIconUrl)}
            aria-hidden="true"
          />
        </button>
        <button
          className={styles.iconButton}
          type="button"
          aria-label="Настройки"
          aria-pressed={isSettingsOpen}
          onClick={onToggleSettings}
        >
          <span
            className={styles.icon}
            style={iconStyle(settingsIconUrl)}
            aria-hidden="true"
          />
        </button>
      </div>
    </header>
  )
}
