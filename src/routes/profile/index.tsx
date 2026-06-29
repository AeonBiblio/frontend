import { createFileRoute } from '@tanstack/react-router'

import {
  paymentProfileQueryOptions,
  profileQueryOptions,
  profileSubscriptionQueryOptions,
} from '@modules/profile/api'
import { apiClient } from '@shared/api/client/api-client'
import { requireAuth } from '@shared/lib/auth-guard'
import { Spinner } from '@shared/ui/spinner/spinner'

export const Route = createFileRoute('/profile/')({
  beforeLoad: async ({ context }) => {
    const user = await requireAuth({
      queryClient: context.queryClient,
    })

    return {
      user,
    }
  },

  loader: async ({ context }) => {
    const user = context.user

    if (!user) {
      return
    }

    const profileQuery = profileQueryOptions(user.id, apiClient)
    const paymentProfileQuery = paymentProfileQueryOptions(user.id, apiClient)
    const subscriptionQuery = profileSubscriptionQueryOptions(
      user.id,
      apiClient,
    )

    await context.queryClient.ensureQueryData(profileQuery)

    await Promise.all([
      context.queryClient
        .ensureQueryData(paymentProfileQuery)
        .catch(() => undefined),

      context.queryClient
        .ensureQueryData(subscriptionQuery)
        .catch(() => undefined),
    ])
  },

  pendingComponent: () => (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Spinner label="Загружаем профиль" />
    </main>
  ),

  head: () => ({
    meta: [{ title: 'Личный кабинет' }],
  }),
})
