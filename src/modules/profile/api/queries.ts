import { queryOptions, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { useSessionQuery } from '@shared/api/auth'
import { isNetworkError } from '@shared/api/client/api-client'
import {
  earningsBookStatsSchema,
  earningsStatsSchema,
  earningsTransactionSchema,
  payoutOutSchema,
  userOutSchema,
  userSubscriptionOutSchema,
} from '@shared/api/core'
import { useApiClient } from '@shared/api/runtimeConfig/provider/provider'
import { db, userOutToLocalUserProfile } from '@shared/lib/db'
import type {
  LocalEarningsBalance,
  LocalPaymentProfile,
  LocalPromoCode,
  LocalUserProfile,
  LocalUserSubscription,
} from '@shared/lib/db'

import {
  cachedAt,
  earningsBalanceSchema,
  getLocalPaymentProfile,
  getPaymentProfileLastDigits,
  getLocalPromoCodes,
  getLocalSubscription,
  parseCollection,
  paymentProfileSchema,
  profileKeys,
  promoCodeSchema,
  shouldReturnNull,
} from './common'

import type { AxiosInstance } from 'axios'

export function profileQueryOptions(userId: string, client: AxiosInstance) {
  return queryOptions<LocalUserProfile | null>({
    queryKey: profileKeys.me,
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async ({ signal }) => {
      try {
        const response = await client.get('/users/me', { signal })
        const user = userOutToLocalUserProfile(
          userOutSchema.parse(response.data),
        )

        await db.userProfiles.put(user)

        return (await db.userProfiles.get(user.id)) ?? user
      } catch (error) {
        if (!isNetworkError(error)) {
          throw error
        }

        return (await db.userProfiles.get(userId)) ?? null
      }
    },
  })
}

export function useProfileQuery({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const client = useApiClient()
  const session = useSessionQuery()
  const userId = session.data?.id

  return useQuery<LocalUserProfile | null>({
    ...profileQueryOptions(userId ?? '', client),
    enabled: enabled && Boolean(userId),
  })
}

export function paymentProfileQueryOptions(
  userId: string,
  client: AxiosInstance,
) {
  return queryOptions<LocalPaymentProfile | null>({
    queryKey: profileKeys.paymentProfile,
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async ({ signal }) => {
      try {
        const response = await client.get('/users/me/payment-profile', {
          signal,
        })
        const profile = paymentProfileSchema.parse(response.data)
        const lastDigits = getPaymentProfileLastDigits(profile)
        const localProfile: LocalPaymentProfile = {
          userId,
          card_last_digits: lastDigits,
          card_last4: lastDigits,
          cachedAt: cachedAt(),
        }

        await db.paymentProfiles.put(localProfile)

        return (await getLocalPaymentProfile(userId)) ?? localProfile
      } catch (error) {
        if (shouldReturnNull(error)) {
          return (await getLocalPaymentProfile(userId)) ?? null
        }

        if (!isNetworkError(error)) {
          throw error
        }

        return (await getLocalPaymentProfile(userId)) ?? null
      }
    },
  })
}

export function usePaymentProfileQuery({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const client = useApiClient()
  const session = useSessionQuery()
  const userId = session.data?.id

  return useQuery<LocalPaymentProfile | null>({
    ...paymentProfileQueryOptions(userId ?? '', client),
    enabled: enabled && Boolean(userId),
  })
}

export function profileSubscriptionQueryOptions(
  userId: string,
  client: AxiosInstance,
) {
  return queryOptions<LocalUserSubscription | null>({
    queryKey: profileKeys.subscription,
    staleTime: 60 * 1000,
    retry: false,
    queryFn: async ({ signal }) => {
      try {
        const response = await client.get('/subscriptions/me', { signal })

        if (response.data == null) {
          return (await getLocalSubscription(userId)) ?? null
        }

        const subscription = userSubscriptionOutSchema.parse(response.data)
        const localSubscription: LocalUserSubscription = {
          id: subscription.id,
          userId: subscription.user_id,
          planId: subscription.plan_id,
          status: subscription.status,
          startedAt: subscription.started_at,
          expiresAt: subscription.expires_at,
          cancelledAt: subscription.cancelled_at,
          autoRenew: subscription.auto_renew,
          cachedAt: cachedAt(),
        }

        await db.userSubscriptions.put(localSubscription)

        return (await getLocalSubscription(userId)) ?? localSubscription
      } catch (error) {
        if (shouldReturnNull(error)) {
          return (await getLocalSubscription(userId)) ?? null
        }

        if (!isNetworkError(error)) {
          throw error
        }

        return (await getLocalSubscription(userId)) ?? null
      }
    },
  })
}

export function useProfileSubscriptionQuery({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const client = useApiClient()
  const session = useSessionQuery()
  const userId = session.data?.id

  return useQuery<LocalUserSubscription | null>({
    ...profileSubscriptionQueryOptions(userId ?? '', client),
    enabled: enabled && Boolean(userId),
  })
}

export function useEarningsBalanceQuery({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const client = useApiClient()
  const session = useSessionQuery()
  const userId = session.data?.id
  const isAuthor = session.data?.role === 'author'

  return useQuery<LocalEarningsBalance | null>({
    queryKey: profileKeys.balance,
    enabled: enabled && Boolean(userId) && isAuthor,
    staleTime: 60 * 1000,
    retry: false,
    queryFn: async ({ signal }) => {
      if (!userId) {
        return null
      }

      try {
        const response = await client.get('/earnings/balance', { signal })
        const balance = earningsBalanceSchema.parse(response.data)
        const localBalance: LocalEarningsBalance = {
          userId,
          availableAmount: balance.available_amount,
          pendingAmount: balance.pending_amount,
          cachedAt: cachedAt(),
        }

        await db.earningsBalances.put(localBalance)

        return (await db.earningsBalances.get(userId)) ?? localBalance
      } catch (error) {
        if (shouldReturnNull(error)) {
          return (await db.earningsBalances.get(userId)) ?? null
        }

        if (!isNetworkError(error)) {
          throw error
        }

        return (await db.earningsBalances.get(userId)) ?? null
      }
    },
  })
}

export function useEarningsStatsQuery({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const client = useApiClient()
  const session = useSessionQuery()
  const isAuthor = session.data?.role === 'author'

  return useQuery({
    queryKey: profileKeys.earningsStats,
    enabled: enabled && isAuthor,
    staleTime: 60 * 1000,
    retry: false,
    queryFn: async ({ signal }) => {
      const response = await client.get('/earnings/stats', { signal })

      return earningsStatsSchema.parse(response.data)
    },
  })
}

export function useEarningsBookStatsQuery({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const client = useApiClient()
  const session = useSessionQuery()
  const isAuthor = session.data?.role === 'author'

  return useQuery({
    queryKey: profileKeys.earningsBookStats,
    enabled: enabled && isAuthor,
    staleTime: 60 * 1000,
    retry: false,
    queryFn: async ({ signal }) => {
      const response = await client.get('/earnings/stats/books', {
        params: { offset: 0, limit: 5 },
        signal,
      })

      return parseCollection(earningsBookStatsSchema, response.data)
    },
  })
}

export function useEarningsPayoutsQuery({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const client = useApiClient()
  const session = useSessionQuery()
  const isAuthor = session.data?.role === 'author'

  return useQuery({
    queryKey: profileKeys.earningsPayouts,
    enabled: enabled && isAuthor,
    staleTime: 60 * 1000,
    retry: false,
    queryFn: async ({ signal }) => {
      const response = await client.get('/earnings/payouts', {
        params: { offset: 0, limit: 5 },
        signal,
      })

      return parseCollection(payoutOutSchema, response.data)
    },
  })
}

export function useEarningsTransactionsQuery({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const client = useApiClient()
  const session = useSessionQuery()
  const isAuthor = session.data?.role === 'author'

  return useQuery({
    queryKey: profileKeys.earningsTransactions,
    enabled: enabled && isAuthor,
    staleTime: 60 * 1000,
    retry: false,
    queryFn: async ({ signal }) => {
      const response = await client.get('/earnings/transactions', {
        params: { offset: 0, limit: 5 },
        signal,
      })

      return parseCollection(earningsTransactionSchema, response.data)
    },
  })
}

export function useProfilePromoCodesQuery({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const client = useApiClient()
  const session = useSessionQuery()
  const userId = session.data?.id

  return useQuery<LocalPromoCode[]>({
    queryKey: profileKeys.promoCodes,
    enabled: enabled && Boolean(userId),
    staleTime: 60 * 1000,
    retry: false,
    queryFn: async ({ signal }) => {
      if (!userId) {
        return []
      }

      try {
        const response = await client.get('/users/me/promo-codes', { signal })
        const promoCodes = z.array(promoCodeSchema).parse(response.data)
        const now = cachedAt()
        const localPromoCodes: LocalPromoCode[] = promoCodes.map(
          (promoCode) => ({
            id: promoCode.id ?? `${userId}:${promoCode.code}`,
            userId,
            scope: 'reader',
            code: promoCode.code,
            discountPercent: promoCode.discount_percent,
            expiresAt: promoCode.expires_at,
            usedAt: promoCode.used_at,
            cachedAt: now,
          }),
        )

        await db.transaction('rw', db.promoCodes, async () => {
          await db.promoCodes
            .where('userId')
            .equals(userId)
            .filter((promoCode) => promoCode.scope === 'reader')
            .delete()
          await db.promoCodes.bulkPut(localPromoCodes)
        })

        return getLocalPromoCodes(userId, 'reader')
      } catch (error) {
        if (!isNetworkError(error) && !shouldReturnNull(error)) {
          throw error
        }

        return getLocalPromoCodes(userId, 'reader')
      }
    },
  })
}

export function useAuthorPromoCodesQuery({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const client = useApiClient()
  const session = useSessionQuery()
  const userId = session.data?.id
  const isAuthor = session.data?.role === 'author'

  return useQuery<LocalPromoCode[]>({
    queryKey: profileKeys.authorPromoCodes,
    enabled: enabled && Boolean(userId) && isAuthor,
    staleTime: 60 * 1000,
    retry: false,
    queryFn: async ({ signal }) => {
      if (!userId) {
        return []
      }

      try {
        const response = await client.get('/earnings/promo-codes', {
          params: { offset: 0, limit: 100 },
          signal,
        })
        const promoCodes = z.array(promoCodeSchema).parse(response.data)
        const now = cachedAt()
        const localPromoCodes: LocalPromoCode[] = promoCodes.map(
          (promoCode) => ({
            id: promoCode.id ?? `${userId}:author:${promoCode.code}`,
            userId,
            scope: 'author',
            code: promoCode.code,
            discountPercent: promoCode.discount_percent,
            expiresAt: promoCode.expires_at,
            usedAt: promoCode.used_at,
            cachedAt: now,
          }),
        )

        await db.transaction('rw', db.promoCodes, async () => {
          await db.promoCodes
            .where('userId')
            .equals(userId)
            .filter((promoCode) => promoCode.scope === 'author')
            .delete()
          await db.promoCodes.bulkPut(localPromoCodes)
        })

        return getLocalPromoCodes(userId, 'author')
      } catch (error) {
        if (!isNetworkError(error) && !shouldReturnNull(error)) {
          throw error
        }

        return getLocalPromoCodes(userId, 'author')
      }
    },
  })
}
