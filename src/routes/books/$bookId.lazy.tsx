import { createLazyFileRoute } from '@tanstack/react-router'

import { BookPage } from '@pages/book'

export const Route = createLazyFileRoute('/books/$bookId')({
  component: BookPage,
})
