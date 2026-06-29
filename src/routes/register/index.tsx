import { createFileRoute } from '@tanstack/react-router'

import { redirectAuthorized } from '@shared/lib/auth-guard'

export const Route = createFileRoute('/register/')({
  beforeLoad: async ({ context }) => {
    await redirectAuthorized({ queryClient: context.queryClient })
  },
  head: () => ({
    meta: [{ title: 'Регистрация' }],
  }),
})
