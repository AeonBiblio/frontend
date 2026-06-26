import { createFileRoute } from '@tanstack/react-router'

import { requireAuth } from '@shared/lib/auth-guard'

export const Route = createFileRoute('/library/')({
  beforeLoad: async ({ context }) => ({
    user: await requireAuth({ queryClient: context.queryClient }),
  }),
  head: () => ({
    meta: [{ title: 'Мои книги' }],
  }),
})
