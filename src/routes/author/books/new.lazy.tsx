import { createLazyFileRoute } from '@tanstack/react-router'

import { AuthorBooksNewPage } from '@pages/author-books-new'

export const Route = createLazyFileRoute('/author/books/new')({
  component: AuthorBooksNewPage,
})
