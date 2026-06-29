import { createFileRoute } from '@tanstack/react-router'

import { redirectAuthorized } from '@shared/lib/auth-guard'

export const Route = createFileRoute('/login/')({
  beforeLoad: async ({ context }) => {
    await redirectAuthorized({ queryClient: context.queryClient })
  },
  head: () => ({
    meta: [{ title: 'Вход' }],
  }),
})
