import { createLazyFileRoute } from '@tanstack/react-router'

import { AuthorBooksPage } from '@pages/author-books'

export const Route = createLazyFileRoute('/author/books/')({
  component: AuthorBooksPage,
})
