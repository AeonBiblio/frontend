import { createLazyFileRoute } from '@tanstack/react-router'

import { LibraryPage } from '@pages/library'

export const Route = createLazyFileRoute('/library/')({
  component: LibraryPage,
})
