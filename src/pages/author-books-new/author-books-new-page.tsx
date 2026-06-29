import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import axios from 'axios'
import { Helmet } from 'react-helmet-async'

import { publishBook, useGenreTagsQuery } from '@modules/books/api'
import type { BookEditorFormData } from '@modules/books/api'
import { BookEditorForm } from '@modules/books/ui'
import { useApiClient } from '@shared/api/runtimeConfig/provider/provider'
import { useRequireAuthor } from '@shared/lib/use-require-author'

import styles from './author-books-new-page.module.scss'

export function AuthorBooksNewPage() {
  const { isAuthorized } = useRequireAuthor()
  const client = useApiClient()
  const navigate = useNavigate()
  const genreTagsQuery = useGenreTagsQuery({ enabled: isAuthorized })

  const publishMutation = useMutation({
    mutationFn: (data: BookEditorFormData) => publishBook(client, data),
    onSuccess: (book) => {
      void navigate({
        to: '/author/books/$bookId/edit',
        params: { bookId: book.id },
      })
    },
  })

  const errorMessage =
    publishMutation.error && axios.isAxiosError(publishMutation.error)
      ? String(
          publishMutation.error.response?.data?.detail ??
            'Не удалось опубликовать книгу',
        )
      : publishMutation.error instanceof Error
        ? publishMutation.error.message
        : null

  return (
    <div className={styles.page}>
      <Helmet>
        <title>Публикация книги</title>
        <meta
          name="description"
          content="Публикация новой книги автора в AeonBiblio."
        />
      </Helmet>
      {!isAuthorized ? (
        <p className={styles.pageState}>Загрузка...</p>
      ) : (
        <BookEditorForm
          errorMessage={errorMessage}
          genreTags={(genreTagsQuery.data ?? []).map((tag) => ({
            id: tag.id,
            label: tag.name,
          }))}
          isGenreTagsLoading={genreTagsQuery.isLoading}
          isSubmitting={publishMutation.isPending}
          mode="publish"
          pageTitle="Публикация"
          submitLabel="Опубликовать"
          onSubmit={async (data) => {
            await publishMutation.mutateAsync(data)
          }}
        />
      )}
    </div>
  )
}
