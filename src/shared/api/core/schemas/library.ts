import { z } from 'zod'

export const readingStatusSchema = z.enum(['reading', 'finished', 'wishlist'])

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

export const createReadlistBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  is_public: z.boolean(),
})

export const updateReadlistBodySchema = createReadlistBodySchema.partial()

export const readlistBookBodySchema = z.object({
  book_id: z.string().uuid(),
})

export type ReadingStatus = z.infer<typeof readingStatusSchema>
export type RecentLibraryItem = z.infer<typeof recentLibraryItemSchema>
export type ReadlistOut = z.infer<typeof readlistOutSchema>
export type ReadlistItemOut = z.infer<typeof readlistItemOutSchema>
export type UserBookStatusOut = z.infer<typeof userBookStatusOutSchema>
export type CreateReadlistBody = z.infer<typeof createReadlistBodySchema>
export type UpdateReadlistBody = z.infer<typeof updateReadlistBodySchema>
export type ReadlistBookBody = z.infer<typeof readlistBookBodySchema>
