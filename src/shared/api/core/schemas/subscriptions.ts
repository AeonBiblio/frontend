import { z } from 'zod'

import { decimalStringSchema } from './common'

export const subscriptionStatusSchema = z.enum([
  'active',
  'cancelled',
  'expired',
])

export const userSubscriptionOutSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  plan_id: z.string().uuid(),
  status: subscriptionStatusSchema,
  started_at: z.string(),
  expires_at: z.string(),
  cancelled_at: z.string().nullable(),
  auto_renew: z.boolean(),
})

export const cardPaymentBodySchema = z.object({
  card_number: z.string().min(12),
  cardholder_name: z.string().min(1),
  expiry_month: z.number().int().min(1).max(12),
  expiry_year: z.number().int().min(2026),
  cvv: z.string().min(3).max(4),
  promo_code: z.string().optional(),
})

export const subscriptionPlanSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().optional(),
    title: z.string().optional(),
    period: z.string().optional(),
    duration: z.string().optional(),
    duration_months: z.number().int().positive().optional(),
    price: decimalStringSchema.optional(),
    amount: decimalStringSchema.optional(),
    monthly_price: decimalStringSchema.optional(),
  })
  .passthrough()

export const subscribeBodySchema = z.object({
  plan_id: z.string().uuid(),
  promo_code: z.string().optional(),
})

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>
export type UserSubscriptionOut = z.infer<typeof userSubscriptionOutSchema>
export type CardPaymentBody = z.infer<typeof cardPaymentBodySchema>
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>
export type SubscribeBody = z.infer<typeof subscribeBodySchema>
