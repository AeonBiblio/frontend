import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { Helmet } from 'react-helmet-async'

import { useBooksQuery, useDeleteBookMutation } from '@modules/books/api'
import { Button } from '@shared/ui/button/button'
import { useRequireAuthor } from '@shared/lib/use-require-author'

import styles from './author-books-page.module.scss'

import type { LocalBook } from '@shared/lib/db'

type AuthorBookItemProps = {
  book: LocalBook
  onDeleted: () => void
}

function AuthorBookItem({ book, onDeleted }: AuthorBookItemProps) {
  const deleteBook = useDeleteBookMutation(book.id)

  const handleDelete = async () => {
    if (!window.confirm('Удалить книгу?')) {
      return
    }

    await deleteBook.mutateAsync()
    onDeleted()
  }

  return (
    <li className={styles.pageItem}>
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
      <div className={styles.pageItemActions}>
        <Link
          className={styles.pageItemLink}
          params={{ bookId: book.id }}
          to="/author/books/$bookId/edit"
        >
          Редактировать
        </Link>
        <button
          className={styles.pageItemDelete}
          type="button"
          disabled={deleteBook.isPending}
          onClick={() => void handleDelete()}
        >
          Удалить
        </button>
      </div>
    </li>
  )
}

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
  const refetchBooks = () => {
    void draftBooksQuery.refetch()
    void publishedBooksQuery.refetch()
  }

  return (
    <div className={styles.page}>
      <Helmet>
        <title>Мои книги</title>
        <meta
          name="description"
          content="Раздел автора AeonBiblio для просмотра, добавления и редактирования своих книг."
        />
      </Helmet>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Мои книги</h1>
        <Link to="/author/books/new">
          <Button type="button">Добавить книгу</Button>
        </Link>
      </div>

      {isLoading ? (
        <p className={styles.pageState}>Загружаем книги...</p>
      ) : books.length === 0 ? (
        <p className={styles.pageState}>У вас пока нет книг</p>
      ) : (
        <ul className={styles.pageList}>
          {books.map((book) => (
            <AuthorBookItem
              book={book}
              key={book.id}
              onDeleted={refetchBooks}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
