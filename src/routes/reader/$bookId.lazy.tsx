import { createLazyFileRoute } from '@tanstack/react-router'

import { ReaderPage } from '@pages/reader'

export const Route = createLazyFileRoute('/reader/$bookId')({
  component: ReaderPage,
})
