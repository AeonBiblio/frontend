import styles from './reader-toc-panel.module.scss'

import type { CSSProperties } from 'react'
import type { ReaderTocTargetKind } from '@shared/lib/db'

export type ReaderTocEntry = {
  id: string
  chapterId?: string
  chapterIndex?: number
  depth: number
  order: number
  pageNumber?: number
  targetKind: ReaderTocTargetKind
  title: string
}

type ReaderTocPanelProps = {
  currentChapterId?: string
  currentChapterIndex?: number
  emptyText?: string
  items: ReaderTocEntry[]
  onSelectItem: (item: ReaderTocEntry) => void
}

function tocDepthStyle(depth: number): CSSProperties {
  return { '--toc-depth': depth } as CSSProperties
}

export function ReaderTocPanel({
  currentChapterId,
  currentChapterIndex,
  emptyText = 'В книге нет доступных глав.',
  items,
  onSelectItem,
}: ReaderTocPanelProps) {
  return (
    <aside className={styles.panel} aria-label="Оглавление">
      <h2 className={styles.title}>Оглавление</h2>

      {items.length === 0 ? (
        <p className={styles.empty}>{emptyText}</p>
      ) : (
        <ol className={styles.list}>
          {items.map((item, index) => {
            const isCurrent =
              (item.chapterId !== undefined &&
                item.chapterId === currentChapterId) ||
              (item.chapterId === undefined &&
                item.chapterIndex !== undefined &&
                item.chapterIndex === currentChapterIndex)
            const isSelectable =
              item.targetKind === 'chapter' || item.targetKind === 'page'

            return (
              <li className={styles.item} key={item.id}>
                <button
                  className={styles.chapterButton}
                  type="button"
                  aria-current={isCurrent ? 'location' : undefined}
                  disabled={!isSelectable}
                  style={tocDepthStyle(item.depth)}
                  onClick={() => onSelectItem(item)}
                >
                  <span className={styles.chapterNumber}>{index + 1}</span>
                  <span className={styles.chapterTitle}>{item.title}</span>
                </button>
              </li>
            )
          })}
        </ol>
      )}
    </aside>
  )
}
