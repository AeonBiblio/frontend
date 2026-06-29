import { z } from 'zod'

import { decimalStringSchema } from './common'

export const earningsPeriodSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
})

export const earningsStatsSchema = z.object({
  total_reads: z.number().int().min(0),
  total_sales: z.number().int().min(0),
  total_earned: decimalStringSchema,
  available_amount: decimalStringSchema,
  pending_amount: decimalStringSchema,
  period: earningsPeriodSchema.nullable(),
})

export const earningsBookStatsSchema = z
  .object({
    book_id: z.string().uuid(),
    title: z.string(),
    cover_key: z.string().nullable().optional(),
    reads: z.number().int().min(0),
    sales: z.number().int().min(0),
    income: decimalStringSchema,
  })
  .passthrough()

export const payoutOutSchema = z
  .object({
    id: z.string().optional(),
    amount: decimalStringSchema,
    status: z.string().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough()

export const earningsTransactionSchema = z
  .object({
    id: z.string().optional(),
    amount: decimalStringSchema,
    type: z.string().optional(),
    source: z.string().optional(),
    description: z.string().nullable().optional(),
    created_at: z.string().optional(),
  })
  .passthrough()

export type EarningsPeriod = z.infer<typeof earningsPeriodSchema>
export type EarningsStats = z.infer<typeof earningsStatsSchema>
export type EarningsBookStats = z.infer<typeof earningsBookStatsSchema>
export type PayoutOut = z.infer<typeof payoutOutSchema>
export type EarningsTransaction = z.infer<typeof earningsTransactionSchema>
