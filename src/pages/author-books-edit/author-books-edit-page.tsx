import { useMutation } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import axios from 'axios'
import { Helmet } from 'react-helmet-async'

import {
  saveBook,
  useBookGenreTagsQuery,
  useBookQuery,
  useGenreTagsQuery,
} from '@modules/books/api'
import type { BookEditorFormData } from '@modules/books/api'
import { BookEditorForm } from '@modules/books/ui'
import { useApiClient } from '@shared/api/runtimeConfig/provider/provider'
import { useRequireAuthor } from '@shared/lib/use-require-author'

import styles from './author-books-edit-page.module.scss'

const editRoute = getRouteApi('/author/books/$bookId/edit')

export function AuthorBooksEditPage() {
  const { bookId } = editRoute.useParams()
  const { isAuthorized } = useRequireAuthor()
  const client = useApiClient()
  const bookQuery = useBookQuery(bookId, { enabled: isAuthorized })
  const bookGenreTagsQuery = useBookGenreTagsQuery(bookId, {
    enabled: isAuthorized,
  })
  const genreTagsQuery = useGenreTagsQuery({ enabled: isAuthorized })

  const saveMutation = useMutation({
    mutationFn: (data: BookEditorFormData) => saveBook(client, bookId, data),
    onSuccess: () => {
      void bookQuery.refetch()
      void bookGenreTagsQuery.refetch()
    },
  })

  if (!isAuthorized || bookQuery.isLoading || bookGenreTagsQuery.isLoading) {
    return (
      <>
        <Helmet>
          <title>Редактирование книги</title>
          <meta
            name="description"
            content="Редактирование книги автора в AeonBiblio."
          />
        </Helmet>
        <p className={styles.pageState}>Загружаем книгу...</p>
      </>
    )
  }

  if (bookQuery.isError || !bookQuery.data) {
    return (
      <>
        <Helmet>
          <title>Книга не найдена</title>
          <meta
            name="description"
            content="Книга автора не найдена в AeonBiblio."
          />
        </Helmet>
        <p className={styles.pageState}>Книга не найдена</p>
      </>
    )
  }

  const book = bookQuery.data
  const errorMessage =
    saveMutation.error && axios.isAxiosError(saveMutation.error)
      ? String(
          saveMutation.error.response?.data?.detail ??
            'Не удалось сохранить изменения',
        )
      : saveMutation.error instanceof Error
        ? saveMutation.error.message
        : null

  return (
    <div className={styles.page}>
      <Helmet>
        <title>Редактирование - {book.title}</title>
        <meta
          name="description"
          content={`Редактирование книги ${book.title} в AeonBiblio.`}
        />
      </Helmet>
      <BookEditorForm
        errorMessage={errorMessage}
        genreTags={(genreTagsQuery.data ?? []).map((tag) => ({
          id: tag.id,
          label: tag.name,
        }))}
        initialValues={{
          title: book.title,
          description: book.description ?? '',
          isInSubscription: book.is_in_subscription,
          price: book.sale_price ?? '',
          genreTagIds: (bookGenreTagsQuery.data ?? []).map((tag) => tag.id),
          existingBookFileLabel: book.file_format
            ? `file-name.${book.file_format}`
            : null,
          existingCoverFileLabel: book.cover_key
            ? (book.cover_key.split('/').pop() ?? 'cover.jpg')
            : null,
        }}
        isGenreTagsLoading={genreTagsQuery.isLoading}
        isSubmitting={saveMutation.isPending}
        mode="edit"
        pageTitle="Редактирование"
        submitLabel="Сохранить изменения"
        onSubmit={async (data) => {
          await saveMutation.mutateAsync(data)
        }}
      />
    </div>
  )
}
