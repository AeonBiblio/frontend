import { createLazyFileRoute } from '@tanstack/react-router'

import { AuthorBooksEditPage } from '@pages/author-books-edit'

export const Route = createLazyFileRoute('/author/books/$bookId/edit')({
  component: AuthorBooksEditPage,
})
