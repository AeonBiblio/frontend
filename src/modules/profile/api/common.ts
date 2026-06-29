import axios from 'axios'
import { z } from 'zod'

import { cardPaymentBodySchema } from '@shared/api/core'
import type { CardPaymentBody } from '@shared/api/core'
import { db } from '@shared/lib/db'
import type { LocalPaymentProfile, LocalPromoCode } from '@shared/lib/db'

export const cachedAt = () => new Date().toISOString()

export const paymentProfileSchema = cardPaymentBodySchema
  .omit({ promo_code: true, cvv: true })
  .partial()
  .extend({
    card_last_digits: z.string().nullable().optional(),
    card_last4: z.string().nullable().optional(),
  })
  .passthrough()

export const earningsBalanceSchema = z
  .object({
    available_amount: z.string(),
    pending_amount: z.string().optional(),
  })
  .passthrough()

export const promoCodeSchema = z
  .object({
    id: z.string().optional(),
    code: z.string(),
    discount_percent: z.number().optional(),
    expires_at: z.string().nullable().optional(),
    used_at: z.string().nullable().optional(),
  })
  .passthrough()

export type PaymentProfile = Omit<LocalPaymentProfile, 'cachedAt' | 'userId'>
export type PaymentProfileBody = Omit<CardPaymentBody, 'promo_code'>
export type PayoutBody = {
  amount: string
}
export type UpdatePasswordBody = {
  current_password: string
  new_password: string
}

export const profileKeys = {
  me: ['profile', 'me'] as const,
  paymentProfile: ['profile', 'payment-profile'] as const,
  subscription: ['profile', 'subscription'] as const,
  balance: ['profile', 'balance'] as const,
  earningsStats: ['profile', 'earnings-stats'] as const,
  earningsBookStats: ['profile', 'earnings-book-stats'] as const,
  earningsPayouts: ['profile', 'earnings-payouts'] as const,
  earningsTransactions: ['profile', 'earnings-transactions'] as const,
  promoCodes: ['profile', 'promo-codes'] as const,
  authorPromoCodes: ['profile', 'author-promo-codes'] as const,
}

export function getCardLastDigits(profile: PaymentProfile | null | undefined) {
  return profile?.card_last_digits ?? profile?.card_last4 ?? null
}

export function getPaymentProfileLastDigits(
  profile: z.infer<typeof paymentProfileSchema>,
) {
  return (
    profile.card_last_digits ??
    profile.card_last4 ??
    profile.card_number?.slice(-4) ??
    null
  )
}

export async function getLocalPaymentProfile(userId: string) {
  const profile = await db.paymentProfiles.get(userId)

  if (!profile) {
    return undefined
  }

  const legacyProfile: LocalPaymentProfile & { card_number?: unknown } = profile
  const legacyCardNumber =
    typeof legacyProfile.card_number === 'string'
      ? legacyProfile.card_number
      : undefined
  const lastDigits =
    profile.card_last_digits ??
    profile.card_last4 ??
    legacyCardNumber?.slice(-4) ??
    null
  const sanitized: LocalPaymentProfile = {
    userId: profile.userId,
    card_last_digits: lastDigits,
    card_last4: lastDigits,
    cachedAt: profile.cachedAt,
  }

  await db.paymentProfiles.put(sanitized)

  return sanitized
}

export function getLocalSubscription(userId: string) {
  return db.userSubscriptions.where('userId').equals(userId).first()
}

export function getLocalPromoCodes(
  userId: string,
  scope: LocalPromoCode['scope'],
) {
  return db.promoCodes
    .where('userId')
    .equals(userId)
    .filter((promoCode) => promoCode.scope === scope)
    .toArray()
}

export function shouldReturnNull(error: unknown) {
  return (
    axios.isAxiosError(error) &&
    (error.response?.status === 403 || error.response?.status === 404)
  )
}

export function parseCollection<T>(schema: z.ZodType<T>, data: unknown): T[] {
  const collection =
    Array.isArray(data) || data == null
      ? data
      : typeof data === 'object' && 'items' in data
        ? data.items
        : typeof data === 'object' && 'results' in data
          ? data.results
          : data

  return z.array(schema).parse(collection)
}
