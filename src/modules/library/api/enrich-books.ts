import type { AxiosInstance } from 'axios'

import { bookOutSchema } from '@shared/api/core'
import type { BookOut } from '@shared/api/core'

export async function enrichBooks(
  client: AxiosInstance,
  bookIds: string[],
): Promise<Map<string, BookOut>> {
  const uniqueIds = [...new Set(bookIds.filter(Boolean))]

  if (uniqueIds.length === 0) {
    return new Map()
  }

  const entries = await Promise.all(
    uniqueIds.map(async (bookId) => {
      try {
        const response = await client.get(`/books/${bookId}`)
        const book = bookOutSchema.parse(response.data)
        return [bookId, book] as const
      } catch {
        const { bookRepository } = await import('@domain/repositories')
        const local = await bookRepository.getById(bookId)

        if (!local) {
          return null
        }

        const book: BookOut = {
          id: local.id,
          title: local.title,
          author_id: local.authorId,
          cover_key: local.coverKey,
          status: local.status,
          is_in_subscription: local.isInSubscription,
          is_for_sale: local.isForSale,
          sale_price: local.salePrice,
          average_rating: local.averageRating,
          ratings_count: local.ratingsCount,
          reviews_count: local.reviewsCount,
          description: local.description,
          file_format: local.fileFormat,
          file_size_bytes: local.fileSizeBytes,
          my_rating: local.myRating,
        }

        return [bookId, book] as const
      }
    }),
  )

  return new Map(
    entries.filter(
      (entry): entry is readonly [string, BookOut] => entry !== null,
    ),
  )
}
