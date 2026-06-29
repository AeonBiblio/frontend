import { z } from 'zod'

import { bookFormatSchema, readerProcessingStatusSchema } from './books'

export const chapterContentTypeSchema = z.enum(['html', 'text', 'json'])

export const readerManifestChapterSchema = z.object({
  id: z.string().uuid(),
  index: z.number().int().min(0),
  title: z.string().nullable().optional(),
  size_bytes: z.number().int().min(0),
  href: z.string(),
  asset_ids: z.array(z.string()),
})

export const readerManifestAssetSchema = z.object({
  id: z.string(),
  href: z.string(),
})

export const readerManifestSchema = z.object({
  book_id: z.string().uuid(),
  format: bookFormatSchema.extract(['epub', 'fb2']),
  version: z.number().int().min(0),
  title: z.string(),
  processing_status: readerProcessingStatusSchema,
  chapters: z.array(readerManifestChapterSchema),
  assets: z.array(readerManifestAssetSchema),
})

export const readerChapterSchema = z.object({
  id: z.string().uuid(),
  book_id: z.string().uuid(),
  index: z.number().int().min(0),
  title: z.string().nullable().optional(),
  content_type: chapterContentTypeSchema,
  html: z.string().optional(),
  text: z.string().optional(),
  json: z.unknown().optional(),
  asset_ids: z.array(z.string()),
})

export type ChapterContentType = z.infer<typeof chapterContentTypeSchema>
export type ReaderManifestChapter = z.infer<typeof readerManifestChapterSchema>
export type ReaderManifestAsset = z.infer<typeof readerManifestAssetSchema>
export type ReaderManifest = z.infer<typeof readerManifestSchema>
export type ReaderChapter = z.infer<typeof readerChapterSchema>
