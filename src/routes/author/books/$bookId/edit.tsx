import { createFileRoute } from '@tanstack/react-router'

import { requireAuthor } from '@shared/lib/author-guard'

export const Route = createFileRoute('/author/books/$bookId/edit')({
  beforeLoad: async ({ context }) => ({
    author: await requireAuthor({ queryClient: context.queryClient }),
  }),
  head: () => ({
    meta: [{ title: 'Редактирование' }],
  }),
})
