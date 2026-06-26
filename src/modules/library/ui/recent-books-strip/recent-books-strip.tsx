import type { BookOut, RecentLibraryItem } from '@shared/api/core'

import { LibraryBookTile } from '../library-book-tile'

import styles from './recent-books-strip.module.scss'

type RecentBooksStripProps = {
  books: Map<string, BookOut>
  items: RecentLibraryItem[]
}

export function RecentBooksStrip({ books, items }: RecentBooksStripProps) {
  if (items.length === 0) {
    return <p className={styles.stripEmpty}>Нет недавно открытых книг</p>
  }

  return (
    <div className={styles.strip}>
      {items.map((item) => {
        const book = books.get(item.book_id)

        return (
          <LibraryBookTile
            coverKey={item.cover_key ?? book?.cover_key}
            key={item.book_id}
            rating={book?.my_rating ?? null}
            title={item.title}
          />
        )
      })}
    </div>
  )
}
