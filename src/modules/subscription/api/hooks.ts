import { useApiQuery, useAuthedMutation } from '@shared/api/core'

import type { SubscribeBody, SubscriptionPlan } from '@shared/api/core'

export const subscriptionKeys = {
  plans: ['subscriptions', 'plans'] as const,
}

export function useSubscriptionPlansQuery({
  enabled = true,
}: { enabled?: boolean } = {}) {
  return useApiQuery<SubscriptionPlan[]>({
    key: subscriptionKeys.plans,
    path: '/subscriptions/plans',
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSubscribeMutation() {
  return useAuthedMutation<unknown, SubscribeBody>(
    '/subscriptions/subscribe',
    'post',
  )
}
