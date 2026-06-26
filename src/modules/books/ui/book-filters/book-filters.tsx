import { RotateCcw, Search } from 'lucide-react'
import { useState } from 'react'

import styles from './book-filters.module.scss'

import type { BookFilters } from '@modules/books/model'
import type { FormEvent } from 'react'

type GenreTag = {
  id: string
  label: string
}

type BookFiltersProps = {
  filters: BookFilters
  genreTags: Array<GenreTag>
  selectedGenreId?: string
  onApply: (filters: BookFilters) => void
  onTagSelect: (genreTagId?: string) => void
  onReset: () => void
}

export function BookFilters({
  filters,
  genreTags,
  selectedGenreId,
  onApply,
  onTagSelect,
  onReset,
}: BookFiltersProps) {
  const [q, setQ] = useState(filters.q ?? '')
  const [sortBy, setSortBy] = useState<'authors' | 'genres'>('authors')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    onApply({
      ...filters,
      q,
      offset: 0,
    })
  }

  const handleReset = () => {
    setQ('')
    setSortBy('authors')
    onReset()
  }

  return (
    <section className={styles.container}>
      <form className={styles.containerForm} onSubmit={handleSubmit}>
        <div className={styles.containerSearchGroup}>
          <div className={styles.containerSearch}>
            <input
              className={styles.containerSearchInput}
              value={q}
              placeholder="Поиск"
              onChange={(event) => setQ(event.target.value)}
            />
            <button
              className={styles.containerSearchButton}
              type="submit"
              aria-label="Поиск"
            >
              <Search aria-hidden="true" size={14} strokeWidth={2} />
            </button>
          </div>

          <button
            className={styles.containerReset}
            type="button"
            aria-label="Сбросить фильтры"
            onClick={handleReset}
          >
            <RotateCcw aria-hidden="true" size={16} strokeWidth={2} />
          </button>
        </div>

        <span className={styles.containerSortLabel}>Сортировать по</span>

        <button
          className={styles.containerSortButton}
          type="button"
          aria-pressed={sortBy === 'authors'}
          onClick={() => setSortBy('authors')}
        >
          Авторы
        </button>

        <button
          className={styles.containerSortButton}
          type="button"
          aria-pressed={sortBy === 'genres'}
          onClick={() => setSortBy('genres')}
        >
          Жанры
        </button>
      </form>

      <div className={styles.containerTags} aria-label="Жанры">
        {genreTags.map((tag) => (
          <button
            key={tag.id}
            className={styles.containerTag}
            type="button"
            aria-pressed={selectedGenreId === tag.id}
            onClick={() => onTagSelect(tag.id)}
          >
            {tag.label}
          </button>
        ))}
      </div>
    </section>
  )
}
