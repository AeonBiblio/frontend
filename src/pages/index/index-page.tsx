import { getRouteApi } from '@tanstack/react-router'

import { useBooksQuery } from '@modules/books/api'
import { bookFiltersSchema, defaultBookFilters } from '@modules/books/model'
import { BookCard, BookFilters } from '@modules/books/ui'

import styles from './index-page.module.scss'

import type { BookFilters as BookFiltersType } from '@modules/books/model'
import type { LocalBook } from '@shared/lib/db'

const indexRoute = getRouteApi('/')

export const indexSearchSchema = bookFiltersSchema

const genreTags = [
  { id: '2a46fa32-b874-4e33-952a-177e479bd7b9', label: 'Тип жанра' },
  { id: '6ea4cc54-8f4f-45f6-9efc-90fb599f8e48', label: 'Тип жанра' },
  { id: '5c91d7d8-88d1-4d42-8c95-4311d2f1682e', label: 'Тип жанра' },
  { id: '999d5302-8519-4df9-b905-2ff146ddf5c9', label: 'Тип жанра' },
  { id: '440e8400-e29b-41d4-a716-446655440001', label: 'Тип жанра' },
  { id: '440e8400-e29b-41d4-a716-446655440002', label: 'Тип жанра' },
  { id: '440e8400-e29b-41d4-a716-446655440003', label: 'Тип жанра' },
  { id: '440e8400-e29b-41d4-a716-446655440004', label: 'Тип жанра' },
]

const cleanFilters = (filters: BookFiltersType) => ({
  q: filters.q || undefined,
  status: filters.status || undefined,
  author_id: filters.author_id || undefined,
  genre_tag_id: filters.genre_tag_id || undefined,
  in_subscription: filters.in_subscription || undefined,
  for_sale: filters.for_sale || undefined,
  offset: filters.offset,
  limit: filters.limit,
})

const formatPrice = (book: LocalBook) => {
  if (!book.isForSale || !book.salePrice) {
    return 'Не продается'
  }

  return `или ${Number(book.salePrice).toLocaleString('ru-RU')} ₽`
}

const getSubscriptionLabel = (book: LocalBook) =>
  book.isInSubscription ? 'По подписке' : 'Без подписки'

export function IndexPage() {
  const filters = indexRoute.useSearch()
  const navigate = indexRoute.useNavigate()
  const booksQuery = useBooksQuery(filters)

  const books = booksQuery.data ?? []

  const applyFilters = (nextFilters: BookFiltersType) => {
    void navigate({
      search: cleanFilters(nextFilters),
    })
  }

  const selectTag = (genreTagId?: string) => {
    applyFilters({
      ...filters,
      genre_tag_id: genreTagId,
      offset: 0,
    })
  }

  const resetFilters = () => {
    applyFilters(defaultBookFilters)
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageContent}>
        <BookFilters
          filters={filters}
          genreTags={genreTags}
          selectedGenreId={filters.genre_tag_id}
          onApply={applyFilters}
          onTagSelect={selectTag}
          onReset={resetFilters}
        />

        {booksQuery.isLoading ? (
          <p className={styles.pageState}>Загружаем книги...</p>
        ) : books.length === 0 ? (
          <p className={styles.pageState}>Книги отсутствуют</p>
        ) : (
          <section className={styles.pageGrid} aria-label="Каталог книг">
            {books.map((book) => (
              <BookCard
                key={book.id}
                className={styles.pageBook}
                title={book.title}
                author={book.authorName ?? `Автор ${book.authorId.slice(0, 8)}`}
                coverSrc={book.coverUrl}
                subscriptionLabel={getSubscriptionLabel(book)}
                priceLabel={formatPrice(book)}
                rating={Number(book.averageRating ?? 0)}
              />
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
