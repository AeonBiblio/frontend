import { z } from 'zod'

export const reviewSentimentSchema = z.enum(['positive', 'negative', 'neutral'])
export const reviewVoteTypeSchema = z.enum(['like', 'dislike'])

export const reviewOutSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  username: z.string(),
  display_tag: z.string().nullable(),
  avatar_key: z.string().nullable(),
  rating: z.number().int().min(1).max(10),
  sentiment: reviewSentimentSchema,
  text: z.string(),
  promo_issued: z.boolean(),
  likes_count: z.number().int().min(0),
  dislikes_count: z.number().int().min(0),
  my_vote: reviewVoteTypeSchema.nullable(),
  created_at: z.string(),
})

export const createReviewBodySchema = z.object({
  rating: z.number().int().min(1).max(10),
  sentiment: reviewSentimentSchema,
  text: z.string().min(1),
})

export const updateReviewBodySchema = createReviewBodySchema.partial()

export const reviewVoteBodySchema = z.object({
  vote: reviewVoteTypeSchema,
})

export const createPromoCodeBodySchema = z.object({
  discount_percent: z.number().int().min(1).max(100),
  expires_in_days: z.number().int().min(1),
})

export type ReviewSentiment = z.infer<typeof reviewSentimentSchema>
export type ReviewVoteType = z.infer<typeof reviewVoteTypeSchema>
export type ReviewOut = z.infer<typeof reviewOutSchema>
export type CreateReviewBody = z.infer<typeof createReviewBodySchema>
export type UpdateReviewBody = z.infer<typeof updateReviewBodySchema>
export type ReviewVoteBody = z.infer<typeof reviewVoteBodySchema>
export type CreatePromoCodeBody = z.infer<typeof createPromoCodeBodySchema>
