import { getRouteApi } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'

import {
  useBookRecommendationsQuery,
  useBooksQuery,
  useGenreTagsQuery,
} from '@modules/books/api'
import {
  bookFiltersSchema,
  bookFiltersSearchSchema,
  defaultBookFilters,
} from '@domain/books/book-filters'
import { BookFilters } from '@modules/books/ui'
import { getCoverSrc } from '@shared/lib/get-cover-src'
import { BookList } from './components/book-list'
import { GenreShelf } from './components/genre-shelf'

import styles from './index-page.module.scss'

import type {
  BookFilters as BookFiltersType,
  BookFiltersSearch,
} from '@domain/books/book-filters'
import type { GenreTag } from './components/genre-shelf'

const indexRoute = getRouteApi('/')

export const indexSearchSchema = bookFiltersSearchSchema

const preferredShelfGenres = [
  'Фантастика',
  'Научная фантастика',
  'Детектив',
  'Фэнтези',
  'Роман',
]

const cleanFilters = (filters: BookFiltersType): BookFiltersSearch => ({
  q: filters.q || undefined,
  status: filters.status || undefined,
  author_id: filters.author_id || undefined,
  genre_tag_id: filters.genre_tag_id || undefined,
  in_subscription: filters.in_subscription || undefined,
  for_sale: filters.for_sale || undefined,
  offset:
    filters.offset === defaultBookFilters.offset ? undefined : filters.offset,
  limit: filters.limit === defaultBookFilters.limit ? undefined : filters.limit,
})

const withDefaultFilters = (filters: BookFiltersSearch): BookFiltersType =>
  bookFiltersSchema.parse({
    ...defaultBookFilters,
    ...filters,
  })

export const getIndexLoaderDeps = (filters: BookFiltersSearch) => ({
  filters: withDefaultFilters(filters),
})

const selectShelfGenres = (genreTags: GenreTag[]) => {
  const preferred = preferredShelfGenres
    .map((name) => genreTags.find((tag) => tag.name === name))
    .filter((tag): tag is GenreTag => Boolean(tag))

  const preferredIds = new Set(preferred.map((tag) => tag.id))
  const fallback = genreTags.filter((tag) => !preferredIds.has(tag.id))

  return [...preferred, ...fallback].slice(0, 4)
}

export function IndexPage() {
  const { filters } = indexRoute.useLoaderDeps()
  const navigate = indexRoute.useNavigate()

  const [suggestionQuery, setSuggestionQuery] = useState('')
  const [canRenderShelves, setCanRenderShelves] = useState(false)

  useEffect(() => {
    const schedule =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback.bind(window)
        : (callback: IdleRequestCallback) => window.setTimeout(callback, 1200)

    const cancel =
      typeof window.cancelIdleCallback === 'function'
        ? window.cancelIdleCallback.bind(window)
        : (id: number) => window.clearTimeout(id)

    const id = schedule(() => {
      setCanRenderShelves(true)
    })

    return () => cancel(id)
  }, [])

  const booksQuery = useBooksQuery(filters)
  const recommendationsQuery = useBookRecommendationsQuery({ limit: 10 })
  const genreTagsQuery = useGenreTagsQuery()

  const suggestionFilters = useMemo<BookFiltersType>(
    () => ({
      ...defaultBookFilters,
      q: suggestionQuery,
      limit: 6,
    }),
    [suggestionQuery],
  )

  const remoteSuggestionsQuery = useBooksQuery(suggestionFilters, {
    enabled: suggestionQuery.trim().length >= 2,
  })

  const books = booksQuery.data ?? []
  const recommendedBooks = recommendationsQuery.data ?? []
  const remoteSuggestionBooks = remoteSuggestionsQuery.data ?? []
  const genreTags = genreTagsQuery.data ?? []

  const genreFilterOptions = useMemo(
    () =>
      genreTags.map((tag) => ({
        id: tag.id,
        label: tag.name,
      })),
    [genreTags],
  )

  const shelfGenres = useMemo(() => selectShelfGenres(genreTags), [genreTags])

  const searchSuggestions = useMemo(() => {
    if (suggestionQuery.trim().length === 0) {
      return []
    }

    const merged = [...remoteSuggestionBooks, ...books]
    const seen = new Set<string>()

    return merged
      .filter((book) => {
        if (seen.has(book.id)) {
          return false
        }

        seen.add(book.id)
        return true
      })
      .map((book) => ({
        id: book.id,
        title: book.title,
        author: book.authorName ?? `Автор ${book.authorId.slice(0, 8)}`,
        coverSrc: getCoverSrc(book.coverKey),
      }))
  }, [books, remoteSuggestionBooks, suggestionQuery])

  const handleSuggestionQueryChange = useCallback((query: string) => {
    setSuggestionQuery(query)
  }, [])

  const applyFilters = useCallback(
    (nextFilters: BookFiltersType) => {
      void navigate({
        search: cleanFilters(nextFilters),
      })
    },
    [navigate],
  )

  const selectTag = useCallback(
    (genreTagId?: string) => {
      applyFilters({
        ...filters,
        genre_tag_id: genreTagId,
        offset: 0,
      })
    },
    [applyFilters, filters],
  )

  const resetFilters = useCallback(() => {
    applyFilters(defaultBookFilters)
  }, [applyFilters])

  return (
    <div className={styles.page}>
      <Helmet>
        <title>AeonBiblio</title>
        <meta
          name="description"
          content="AeonBiblio — каталог электронных книг, рекомендаций и жанровых подборок."
        />
      </Helmet>

      <div className={styles.pageContent}>
        <BookFilters
          filters={filters}
          genreTags={genreFilterOptions}
          selectedGenreId={filters.genre_tag_id}
          suggestions={searchSuggestions}
          onApply={applyFilters}
          onSuggestionQueryChange={handleSuggestionQueryChange}
          onTagSelect={selectTag}
          onReset={resetFilters}
        />

        {booksQuery.isLoading ? (
          <p className={styles.pageState}>Загружаем книги...</p>
        ) : books.length === 0 ? (
          <p className={styles.pageState}>Книги отсутствуют</p>
        ) : (
          <section className={styles.catalog} aria-label="Каталог книг">
            <div className={styles.catalogHeader}>
              <h1 className={styles.catalogTitle}>Каталог</h1>
            </div>
            <BookList books={books} priorityCount={5} />
          </section>
        )}

        {recommendedBooks.length > 0 && (
          <section className={styles.shelf} aria-label="Рекомендации">
            <div className={styles.shelfHeader}>
              <h2 className={styles.shelfTitle}>Рекомендации</h2>
            </div>
            <BookList
              books={recommendedBooks}
              priorityCount={5}
              className={styles.shelfTrack}
            />
          </section>
        )}

        {canRenderShelves && shelfGenres.length > 0 && (
          <div className={styles.shelves} aria-label="Подборки по жанрам">
            {shelfGenres.map((genre) => (
              <GenreShelf key={genre.id} genre={genre} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
