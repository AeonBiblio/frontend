import { z } from 'zod'

export const userRoleSchema = z.enum(['reader', 'author'])
export const bookStatusSchema = z.enum([
  'draft',
  'pending',
  'published',
  'rejected',
])
export const reviewSentimentSchema = z.enum(['positive', 'negative', 'neutral'])
export const reviewVoteTypeSchema = z.enum(['like', 'dislike'])
export const readingStatusSchema = z.enum(['reading', 'finished', 'wishlist'])

export const decimalStringSchema = z.string().regex(/^\d+(\.\d{1,2})?$/)

export const tokenPairSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.literal('bearer'),
})

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const registerBodySchema = loginBodySchema.extend({
  username: z.string().min(3).max(50),
  role: userRoleSchema.optional(),
})

export const refreshBodySchema = z.object({
  refresh_token: z.string(),
})

export const updateUserBodySchema = z.object({
  username: z.string().min(3).max(50).optional(),
  display_tag: z.string().optional(),
})

export const userOutSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string(),
  display_tag: z.string().nullable(),
  avatar_key: z.string().nullable(),
  role: userRoleSchema,
  is_email_verified: z.boolean(),
  created_at: z.string(),
})

export const publicUserOutSchema = userOutSchema.omit({
  email: true,
  is_email_verified: true,
  created_at: true,
})

export const bookListItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  author_id: z.string().uuid(),
  cover_key: z.string().nullable().optional(),
  status: bookStatusSchema,
  is_in_subscription: z.boolean(),
  is_for_sale: z.boolean(),
  sale_price: decimalStringSchema.nullable().optional(),
  average_rating: decimalStringSchema.nullable().optional(),
  ratings_count: z.number().int().min(0),
  reviews_count: z.number().int().min(0),
})

export const bookOutSchema = bookListItemSchema.extend({
  description: z.string().nullable().optional(),
  file_format: z.string().nullable().optional(),
  file_size_bytes: z.number().int().min(0).nullable().optional(),
  my_rating: z.number().int().min(1).max(10).nullable().optional(),
})

export const createBookBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  is_in_subscription: z.boolean().optional(),
  is_for_sale: z.boolean().optional(),
  sale_price: decimalStringSchema.nullable().optional(),
})

export const updateBookBodySchema = createBookBodySchema.partial()

export const bookRatingOutSchema = z.object({
  average_rating: decimalStringSchema.nullable(),
  ratings_count: z.number().int().min(0),
  reviews_count: z.number().int().min(0),
  my_rating: z.number().int().min(1).max(10).nullable().optional(),
})

export const putBookRatingBodySchema = z.object({
  score: z.number().int().min(1).max(10),
})

export const reviewOutSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  username: z.string(),
  display_tag: z.string().nullable(),
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

export const recentLibraryItemSchema = z.object({
  book_id: z.string().uuid(),
  title: z.string(),
  cover_key: z.string().nullable().optional(),
  status: readingStatusSchema,
  progress_percent: z.number().min(0).max(100),
  updated_at: z.string(),
})

export const readlistOutSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  is_public: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const readlistItemOutSchema = z.object({
  id: z.string().uuid(),
  readlist_id: z.string().uuid(),
  book_id: z.string().uuid(),
  added_at: z.string(),
})

export const userBookStatusOutSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  book_id: z.string().uuid(),
  status: readingStatusSchema,
  progress_percent: z.number().min(0).max(100).nullable(),
  updated_at: z.string(),
})

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

export const createReadlistBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  is_public: z.boolean(),
})

export const updateReadlistBodySchema = createReadlistBodySchema.partial()

export const readlistBookBodySchema = z.object({
  book_id: z.string().uuid(),
})

export const bookAccessOutSchema = z.object({
  can_read: z.boolean(),
  reason: z.string().nullable(),
  file_size_bytes: z.number().int().min(0).nullable().optional(),
  file_format: z.string().nullable().optional(),
})

export const uploadUrlOutSchema = z.object({
  upload_url: z.string().url(),
  object_key: z.string(),
})

export const genreTagOutSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
})

export const bookGenreTagsUpdateSchema = z.object({
  genre_tag_ids: z.array(z.string().uuid()),
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

export type UserRole = z.infer<typeof userRoleSchema>
export type BookStatus = z.infer<typeof bookStatusSchema>
export type ReviewSentiment = z.infer<typeof reviewSentimentSchema>
export type ReviewVoteType = z.infer<typeof reviewVoteTypeSchema>
export type ReadingStatus = z.infer<typeof readingStatusSchema>
export type TokenPair = z.infer<typeof tokenPairSchema>
export type LoginBody = z.infer<typeof loginBodySchema>
export type RegisterBody = z.infer<typeof registerBodySchema>
export type RefreshBody = z.infer<typeof refreshBodySchema>
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>
export type UserOut = z.infer<typeof userOutSchema>
export type PublicUserOut = z.infer<typeof publicUserOutSchema>
export type BookListItem = z.infer<typeof bookListItemSchema>
export type BookOut = z.infer<typeof bookOutSchema>
export type BookRatingOut = z.infer<typeof bookRatingOutSchema>
export type CreateBookBody = z.infer<typeof createBookBodySchema>
export type UpdateBookBody = z.infer<typeof updateBookBodySchema>
export type PutBookRatingBody = z.infer<typeof putBookRatingBodySchema>
export type ReviewOut = z.infer<typeof reviewOutSchema>
export type CreateReviewBody = z.infer<typeof createReviewBodySchema>
export type UpdateReviewBody = z.infer<typeof updateReviewBodySchema>
export type ReviewVoteBody = z.infer<typeof reviewVoteBodySchema>
export type CreatePromoCodeBody = z.infer<typeof createPromoCodeBodySchema>
export type RecentLibraryItem = z.infer<typeof recentLibraryItemSchema>
export type ReadlistOut = z.infer<typeof readlistOutSchema>
export type ReadlistItemOut = z.infer<typeof readlistItemOutSchema>
export type UserBookStatusOut = z.infer<typeof userBookStatusOutSchema>
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>
export type UserSubscriptionOut = z.infer<typeof userSubscriptionOutSchema>
export type CreateReadlistBody = z.infer<typeof createReadlistBodySchema>
export type UpdateReadlistBody = z.infer<typeof updateReadlistBodySchema>
export type ReadlistBookBody = z.infer<typeof readlistBookBodySchema>
export type BookAccessOut = z.infer<typeof bookAccessOutSchema>
export type UploadUrlOut = z.infer<typeof uploadUrlOutSchema>
export type GenreTagOut = z.infer<typeof genreTagOutSchema>
export type BookGenreTagsUpdate = z.infer<typeof bookGenreTagsUpdateSchema>
export type CardPaymentBody = z.infer<typeof cardPaymentBodySchema>
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>
export type SubscribeBody = z.infer<typeof subscribeBodySchema>
