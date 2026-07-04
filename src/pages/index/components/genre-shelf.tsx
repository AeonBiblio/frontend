import { memo, useMemo } from 'react'

import { useBooksQuery } from '@modules/books/api'
import { defaultBookFilters } from '@domain/books/book-filters'
import { BookList } from './book-list'
import styles from '../index-page.module.scss'

import type { BookFilters } from '@domain/books/book-filters'

export type GenreTag = {
  id: string
  name: string
}

type GenreShelfProps = {
  genre: GenreTag
  enabled?: boolean
}

function createShelfFilters(genreTagId: string): BookFilters {
  return {
    ...defaultBookFilters,
    genre_tag_id: genreTagId,
    limit: 8,
  }
}

export const GenreShelf = memo(function GenreShelfView({
  genre,
  enabled = true,
}: GenreShelfProps) {
  const filters = useMemo(() => createShelfFilters(genre.id), [genre.id])

  const booksQuery = useBooksQuery(filters, {
    enabled,
  })

  const books = booksQuery.data ?? []

  if (!enabled || booksQuery.isLoading || books.length === 0) {
    return null
  }

  return (
    <section className={styles.shelf} aria-label={genre.name}>
      <div className={styles.shelfHeader}>
        <h2 className={styles.shelfTitle}>{genre.name}</h2>
      </div>

      <BookList books={books} className={styles.shelfTrack} priorityCount={0} />
    </section>
  )
})
