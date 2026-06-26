import { z } from 'zod'

const emptyToUndefined = (value: unknown) => {
  if (value === '' || value === null) {
    return undefined
  }

  return value
}

const searchBooleanSchema = z.preprocess((value) => {
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  return value
}, z.boolean().optional())

export const bookStatusSchema = z.enum([
  'draft',
  'pending',
  'published',
  'rejected',
])

export const bookFiltersSchema = z.object({
  q: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  status: z.preprocess(
    emptyToUndefined,
    bookStatusSchema.catch('published').optional(),
  ),
  author_id: z.preprocess(
    emptyToUndefined,
    z.string().uuid().optional().catch(undefined),
  ),
  genre_tag_id: z.preprocess(
    emptyToUndefined,
    z.string().uuid().optional().catch(undefined),
  ),
  in_subscription: searchBooleanSchema,
  for_sale: searchBooleanSchema,
  offset: z.coerce.number().int().min(0).catch(0),
  limit: z.coerce.number().int().min(1).max(100).catch(20),
})

export type BookFilters = z.infer<typeof bookFiltersSchema>
export type BookStatus = z.infer<typeof bookStatusSchema>

export const defaultBookFilters: BookFilters = {
  offset: 0,
  limit: 20,
}
