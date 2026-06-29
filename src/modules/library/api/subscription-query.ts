import { useQuery } from '@tanstack/react-query'

import { userSubscriptionOutSchema } from '@shared/api/core'
import type { UserSubscriptionOut } from '@shared/api/core'
import { useSessionQuery } from '@shared/api/auth'
import { useApiClient } from '@shared/api/runtimeConfig/provider/provider'
import type { LocalUserSubscription } from '@shared/lib/db'

const subscriptionMeKey = ['subscriptions', 'me'] as const

function localSubscriptionToOut(
  subscription: LocalUserSubscription,
): UserSubscriptionOut {
  return {
    id: subscription.id,
    user_id: subscription.userId,
    plan_id: subscription.planId,
    status: subscription.status,
    started_at: subscription.startedAt,
    expires_at: subscription.expiresAt,
    cancelled_at: subscription.cancelledAt,
    auto_renew: subscription.autoRenew,
  }
}

async function saveSubscriptionInBackground(
  subscription: LocalUserSubscription,
) {
  const { db } = await import('@shared/lib/db')

  await db.userSubscriptions.put(subscription)
}

async function readLocalSubscription(userId: string) {
  const { db } = await import('@shared/lib/db')

  return db.userSubscriptions.where('userId').equals(userId).first()
}

export function useSubscriptionMeQuery({ enabled = true } = {}) {
  const client = useApiClient()
  const session = useSessionQuery()
  const isAuthenticated = session.isSuccess && session.data !== null

  return useQuery<UserSubscriptionOut | null>({
    queryKey: subscriptionMeKey,
    enabled: enabled && isAuthenticated,
    staleTime: 60 * 1000,
    retry: false,
    queryFn: async () => {
      const userId = session.data?.id

      if (!userId) {
        return null
      }

      try {
        const response = await client.get('/subscriptions/me')
        const data = response.data

        if (data == null) {
          return null
        }

        const subscription = userSubscriptionOutSchema.parse(data)
        const localSubscription: LocalUserSubscription = {
          id: subscription.id,
          userId: subscription.user_id,
          planId: subscription.plan_id,
          status: subscription.status,
          startedAt: subscription.started_at,
          expiresAt: subscription.expires_at,
          cancelledAt: subscription.cancelled_at,
          autoRenew: subscription.auto_renew,
          cachedAt: new Date().toISOString(),
        }

        void saveSubscriptionInBackground(localSubscription)

        return localSubscriptionToOut(localSubscription)
      } catch (error) {
        const localSubscription = await readLocalSubscription(userId)

        if (localSubscription) {
          return localSubscriptionToOut(localSubscription)
        }

        throw error
      }
    },
  })
}
