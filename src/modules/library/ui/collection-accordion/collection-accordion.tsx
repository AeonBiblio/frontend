import clsx from 'clsx'
import { useState } from 'react'

import type { BookOut } from '@shared/api/core'
import { Input } from '@shared/ui/input/input'

import { LibraryBookTile } from '../library-book-tile'

import styles from './collection-accordion.module.scss'

type CollectionAccordionProps = {
  books: Map<string, BookOut>
  bookIds: string[]
  canEdit?: boolean
  isRenaming?: boolean
  isRemovingBook?: boolean
  onAddBooks?: () => void
  onDelete?: () => void
  onRemoveBook?: (bookId: string) => void
  onRename?: (title: string) => void | Promise<void>
  title: string
}

export function CollectionAccordion({
  books,
  bookIds,
  canEdit = false,
  isRenaming = false,
  isRemovingBook = false,
  onAddBooks,
  onDelete,
  onRemoveBook,
  onRename,
  title,
}: CollectionAccordionProps) {
  const [expanded, setExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(title)

  const handleRename = async () => {
    const trimmed = draftTitle.trim()

    if (!trimmed || !onRename) {
      return
    }

    await onRename(trimmed)
    setIsEditing(false)
  }

  return (
    <section className={styles.accordion}>
      <div className={styles.accordionHeader}>
        <button
          className={styles.accordionToggle}
          type="button"
          onClick={() => setExpanded((value) => !value)}
        >
          <span
            className={clsx(
              styles.accordionChevron,
              expanded && styles.accordionChevronOpen,
            )}
          >
            ▾
          </span>
          {isEditing ? (
            <Input
              value={draftTitle}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => setDraftTitle(event.target.value)}
            />
          ) : (
            <span className={styles.accordionTitle}>{title}</span>
          )}
        </button>
        {canEdit ? (
          <button
            className={styles.accordionEdit}
            disabled={isRenaming}
            type="button"
            onClick={() => {
              setIsEditing((value) => !value)
              setDraftTitle(title)
            }}
          >
            ✎
          </button>
        ) : null}
      </div>

      {expanded ? (
        <div className={styles.accordionBody}>
          {canEdit ? (
            <div className={styles.accordionActions}>
              <button
                className={styles.accordionAction}
                type="button"
                onClick={onDelete}
              >
                Удалить коллекцию
              </button>
              <button
                className={styles.accordionAction}
                type="button"
                onClick={onAddBooks}
              >
                Добавить в коллекцию
              </button>
              {isEditing ? (
                <button
                  className={styles.accordionAction}
                  disabled={isRenaming}
                  type="button"
                  onClick={handleRename}
                >
                  Сохранить название
                </button>
              ) : (
                <button
                  className={styles.accordionAction}
                  type="button"
                  onClick={() => setIsEditing(true)}
                >
                  Изменить название
                </button>
              )}
            </div>
          ) : null}

          {bookIds.length === 0 ? (
            <p className={styles.accordionEmpty}>В коллекции пока нет книг</p>
          ) : (
            <div className={styles.accordionGrid}>
              {bookIds.map((bookId) => {
                const book = books.get(bookId)

                return (
                  <LibraryBookTile
                    coverKey={book?.cover_key}
                    disabledRemove={isRemovingBook}
                    key={bookId}
                    onRemove={
                      onRemoveBook ? () => onRemoveBook(bookId) : undefined
                    }
                    rating={book?.my_rating ?? null}
                    title={book?.title ?? 'Книга'}
                  />
                )
              })}
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}
