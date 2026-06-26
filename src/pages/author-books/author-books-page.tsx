import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'

import { useBooksQuery } from '@modules/books/api'
import { Button } from '@shared/ui/button/button'
import { useRequireAuthor } from '@shared/lib/use-require-author'

import styles from './author-books-page.module.scss'

export function AuthorBooksPage() {
  const { session, isAuthorized } = useRequireAuthor()
  const authorId = session.data?.id ?? ''
  const draftBooksQuery = useBooksQuery(
    {
      author_id: authorId,
      status: 'draft',
      offset: 0,
      limit: 50,
    },
    { enabled: isAuthorized },
  )
  const publishedBooksQuery = useBooksQuery(
    {
      author_id: authorId,
      status: 'published',
      offset: 0,
      limit: 50,
    },
    { enabled: isAuthorized },
  )

  const books = useMemo(() => {
    const merged = [
      ...(draftBooksQuery.data ?? []),
      ...(publishedBooksQuery.data ?? []),
    ]

    return merged.sort((left, right) => left.title.localeCompare(right.title))
  }, [draftBooksQuery.data, publishedBooksQuery.data])

  const isLoading =
    !isAuthorized || draftBooksQuery.isLoading || publishedBooksQuery.isLoading

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Мои книги</h1>
        <Link to="/author/books/new">
          <Button type="button">Опубликовать новую</Button>
        </Link>
      </div>

      {isLoading ? (
        <p className={styles.pageState}>Загружаем книги...</p>
      ) : books.length === 0 ? (
        <p className={styles.pageState}>У вас пока нет книг</p>
      ) : (
        <ul className={styles.pageList}>
          {books.map((book) => (
            <li className={styles.pageItem} key={book.id}>
              <div className={styles.pageItemInfo}>
                <h2 className={styles.pageItemTitle}>{book.title}</h2>
                <p className={styles.pageItemMeta}>
                  Статус: {book.status}
                  {book.isForSale && book.salePrice
                    ? ` · ${Number(book.salePrice).toLocaleString('ru-RU')} ₽`
                    : ''}
                  {book.isInSubscription ? ' · В подписке' : ''}
                </p>
              </div>
              <Link
                className={styles.pageItemLink}
                params={{ bookId: book.id }}
                to="/author/books/$bookId/edit"
              >
                Редактировать
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
