import { memo, useMemo } from 'react'

import { BookCard } from '@modules/books/ui'
import styles from '../index-page.module.scss'

import type { LocalBook } from '@shared/lib/db'

type BookListProps = {
  books: LocalBook[]
  className?: string
  priorityCount?: number
}

const priceFormatter = new Intl.NumberFormat('ru-RU')

function formatPrice(book: LocalBook) {
  if (!book.isForSale || !book.salePrice) {
    return 'Не продается'
  }

  return `или ${priceFormatter.format(Number(book.salePrice))} ₽`
}

function getSubscriptionLabel(book: LocalBook) {
  return book.isInSubscription ? 'По подписке' : 'Без подписки'
}

function getAuthorLabel(book: LocalBook) {
  return book.authorName ?? `Автор ${book.authorId.slice(0, 8)}`
}

export const BookList = memo(function BookListView({
  books,
  className,
  priorityCount = 0,
}: BookListProps) {
  const bookItems = useMemo(
    () =>
      books.map((book, index) => ({
        id: book.id,
        title: book.title,
        author: getAuthorLabel(book),
        coverSrc: book.coverUrl,
        subscriptionLabel: getSubscriptionLabel(book),
        priceLabel: formatPrice(book),
        rating: Number(book.averageRating ?? 0),
        isPriority: index < priorityCount,
      })),
    [books, priorityCount],
  )

  return (
    <div className={className ?? styles.pageGrid}>
      {bookItems.map((book) => (
        <BookCard
          key={book.id}
          bookId={book.id}
          className={styles.pageBook}
          title={book.title}
          author={book.author}
          coverSrc={book.coverSrc}
          subscriptionLabel={book.subscriptionLabel}
          priceLabel={book.priceLabel}
          rating={book.rating}
          imageLoading={book.isPriority ? 'eager' : 'lazy'}
          imageFetchPriority={book.isPriority ? 'high' : 'auto'}
        />
      ))}
    </div>
  )
})
