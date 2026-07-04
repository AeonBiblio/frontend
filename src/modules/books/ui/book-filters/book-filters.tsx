import { RotateCcw, Search } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { CoverImage } from '@shared/ui/cover-image'

import styles from './book-filters.module.scss'

import type { BookFilters as BookFiltersType } from '@domain/books/book-filters'
import type { ChangeEvent, FocusEvent, FormEvent, MouseEvent } from 'react'

type GenreTag = {
  id: string
  label: string
}

export type BookSearchSuggestion = {
  author: string
  coverSrc: string
  id: string
  title: string
}

type BookFiltersProps = {
  filters: BookFiltersType
  genreTags: Array<GenreTag>
  selectedGenreId?: string
  suggestions?: BookSearchSuggestion[]
  onApply: (filters: BookFiltersType) => void
  onSuggestionQueryChange?: (query: string) => void
  onTagSelect: (genreTagId?: string) => void
  onReset: () => void
}

const MIN_SUGGESTION_QUERY_LENGTH = 2

export const BookFilters = memo(function BookFiltersComponent({
  filters,
  genreTags,
  selectedGenreId,
  suggestions = [],
  onApply,
  onSuggestionQueryChange,
  onTagSelect,
  onReset,
}: BookFiltersProps) {
  const [q, setQ] = useState(filters.q ?? '')
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)

  const lastEmittedSuggestionQueryRef = useRef<string>('')

  useEffect(() => {
    setQ(filters.q ?? '')
  }, [filters.q])

  const trimmedQuery = useMemo(() => q.trim(), [q])

  const normalizedQuery = useMemo(
    () => trimmedQuery.toLowerCase(),
    [trimmedQuery],
  )

  const deferredNormalizedQuery = useDeferredValue(normalizedQuery)

  useEffect(() => {
    if (!onSuggestionQueryChange) {
      return
    }

    const queryForRemoteSuggestions =
      trimmedQuery.length >= MIN_SUGGESTION_QUERY_LENGTH ? trimmedQuery : ''

    const timeoutId = window.setTimeout(() => {
      if (lastEmittedSuggestionQueryRef.current === queryForRemoteSuggestions) {
        return
      }

      lastEmittedSuggestionQueryRef.current = queryForRemoteSuggestions
      onSuggestionQueryChange(queryForRemoteSuggestions)
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [onSuggestionQueryChange, trimmedQuery])

  const visibleSuggestions = useMemo(() => {
    if (
      !suggestionsOpen ||
      deferredNormalizedQuery.length < MIN_SUGGESTION_QUERY_LENGTH
    ) {
      return []
    }

    return suggestions
      .filter((suggestion) =>
        `${suggestion.title} ${suggestion.author}`
          .toLowerCase()
          .includes(deferredNormalizedQuery),
      )
      .slice(0, 6)
  }, [deferredNormalizedQuery, suggestions, suggestionsOpen])

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      onApply({
        ...filters,
        q: trimmedQuery,
        offset: 0,
      })
    },
    [filters, onApply, trimmedQuery],
  )

  const handleReset = useCallback(() => {
    setQ('')
    setSuggestionsOpen(false)

    lastEmittedSuggestionQueryRef.current = ''
    onSuggestionQueryChange?.('')
    onReset()
  }, [onReset, onSuggestionQueryChange])

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setQ(event.target.value)
      setSuggestionsOpen(true)
    },
    [],
  )

  const handleSearchBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setSuggestionsOpen(false)
    }
  }, [])

  const handleSearchFocus = useCallback(() => {
    setSuggestionsOpen(true)
  }, [])

  const handleSubscriptionToggle = useCallback(() => {
    onApply({
      ...filters,
      in_subscription: filters.in_subscription ? undefined : true,
      offset: 0,
    })
  }, [filters, onApply])

  const handleForSaleToggle = useCallback(() => {
    onApply({
      ...filters,
      for_sale: filters.for_sale ? undefined : true,
      offset: 0,
    })
  }, [filters, onApply])

  const handleAllGenresClick = useCallback(() => {
    onTagSelect(undefined)
  }, [onTagSelect])

  const handleGenreTagClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const genreTagId = event.currentTarget.dataset.genreTagId

      if (!genreTagId) {
        return
      }

      onTagSelect(genreTagId)
    },
    [onTagSelect],
  )

  return (
    <section className={styles.container}>
      <form className={styles.containerForm} onSubmit={handleSubmit}>
        <div className={styles.containerSearchGroup}>
          <div
            className={styles.containerSearch}
            onBlur={handleSearchBlur}
            onFocus={handleSearchFocus}
          >
            <input
              className={styles.containerSearchInput}
              value={q}
              type="search"
              placeholder="Поиск"
              autoComplete="off"
              onChange={handleSearchChange}
            />

            <button
              className={styles.containerSearchButton}
              type="submit"
              aria-label="Поиск"
            >
              <Search aria-hidden="true" size={14} strokeWidth={2} />
            </button>

            {visibleSuggestions.length > 0 && (
              <div className={styles.containerSuggestions}>
                {visibleSuggestions.map((suggestion) => (
                  <Link
                    key={suggestion.id}
                    className={styles.containerSuggestion}
                    params={{ bookId: suggestion.id }}
                    to="/books/$bookId"
                  >
                    <CoverImage
                      className={styles.containerSuggestionCover}
                      src={suggestion.coverSrc}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width={40}
                      height={56}
                    />

                    <span className={styles.containerSuggestionText}>
                      <strong>{suggestion.title}</strong>
                      <span>{suggestion.author}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
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

        <span className={styles.containerSortLabel}>Показать</span>

        <button
          className={styles.containerSortButton}
          type="button"
          aria-pressed={filters.in_subscription === true}
          onClick={handleSubscriptionToggle}
        >
          По подписке
        </button>

        <button
          className={styles.containerSortButton}
          type="button"
          aria-pressed={filters.for_sale === true}
          onClick={handleForSaleToggle}
        >
          Можно купить
        </button>
      </form>

      <div className={styles.containerTags} aria-label="Жанры">
        <button
          className={styles.containerTag}
          type="button"
          aria-pressed={!selectedGenreId}
          onClick={handleAllGenresClick}
        >
          Все жанры
        </button>

        {genreTags.map((tag) => (
          <button
            key={tag.id}
            className={styles.containerTag}
            type="button"
            data-genre-tag-id={tag.id}
            aria-pressed={selectedGenreId === tag.id}
            onClick={handleGenreTagClick}
          >
            {tag.label}
          </button>
        ))}
      </div>
    </section>
  )
})
