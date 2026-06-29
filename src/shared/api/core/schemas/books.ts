import { z } from 'zod'

import { decimalStringSchema } from './common'

export const bookStatusSchema = z.enum([
  'draft',
  'pending',
  'published',
  'rejected',
])
export const bookFormatSchema = z.enum(['epub', 'fb2', 'pdf'])
export const bookAccessSourceSchema = z.enum([
  'purchase',
  'subscription',
  'author',
])
export const readerProcessingStatusSchema = z.enum([
  'none',
  'pending',
  'processing',
  'ready',
  'failed',
])

export const bookListItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  author_id: z.string().uuid(),
  author_name: z.string().nullable().optional(),
  author_username: z.string().nullable().optional(),
  author_display_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  cover_key: z.string().nullable().optional(),
  file_key: z.string().nullable().optional(),
  file_format: bookFormatSchema.nullable().optional(),
  file_size_bytes: z.number().int().min(0).nullable().optional(),
  status: bookStatusSchema,
  is_in_subscription: z.boolean(),
  subscription_payout_amount: decimalStringSchema.nullable().optional(),
  is_for_sale: z.boolean(),
  sale_price: decimalStringSchema.nullable().optional(),
  rejection_reason: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  reader_processing_status: readerProcessingStatusSchema.optional(),
  reader_processing_error: z.string().nullable().optional(),
  reader_manifest_version: z.number().int().min(0).nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  average_rating: decimalStringSchema.nullable().optional(),
  ratings_count: z.number().int().min(0),
  reviews_count: z.number().int().min(0),
  my_rating: z.number().int().min(1).max(10).nullable().optional(),
})

export const bookOutSchema = bookListItemSchema.extend({
  description: z.string().nullable(),
  file_key: z.string().nullable(),
  file_format: bookFormatSchema.nullable(),
  file_size_bytes: z.number().int().min(0).nullable(),
  subscription_payout_amount: decimalStringSchema.nullable(),
  rejection_reason: z.string().nullable(),
  reader_processing_status: readerProcessingStatusSchema,
  reader_processing_error: z.string().nullable(),
  reader_manifest_version: z.number().int().min(0),
  created_at: z.string(),
  updated_at: z.string(),
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

export const bookAccessOutSchema = z.object({
  can_read: z.boolean(),
  reason: z.string().nullable(),
  source: bookAccessSourceSchema.nullable().optional(),
  file_size_bytes: z.number().int().min(0).nullable().optional(),
  file_format: bookFormatSchema.nullable().optional(),
  reader_processing_status: readerProcessingStatusSchema.optional(),
  reader_manifest_version: z.number().int().min(0).optional(),
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

export type BookStatus = z.infer<typeof bookStatusSchema>
export type BookFormat = z.infer<typeof bookFormatSchema>
export type BookAccessSource = z.infer<typeof bookAccessSourceSchema>
export type ReaderProcessingStatus = z.infer<
  typeof readerProcessingStatusSchema
>
export type BookListItem = z.infer<typeof bookListItemSchema>
export type BookOut = z.infer<typeof bookOutSchema>
export type BookRatingOut = z.infer<typeof bookRatingOutSchema>
export type CreateBookBody = z.infer<typeof createBookBodySchema>
export type UpdateBookBody = z.infer<typeof updateBookBodySchema>
export type PutBookRatingBody = z.infer<typeof putBookRatingBodySchema>
export type BookAccessOut = z.infer<typeof bookAccessOutSchema>
export type UploadUrlOut = z.infer<typeof uploadUrlOutSchema>
export type GenreTagOut = z.infer<typeof genreTagOutSchema>
export type BookGenreTagsUpdate = z.infer<typeof bookGenreTagsUpdateSchema>
