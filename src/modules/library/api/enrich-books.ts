import type { AxiosInstance } from 'axios'

import { bookOutSchema } from '@shared/api/core'
import type { BookOut } from '@shared/api/core'
import { bookOutToLocalBook } from '@shared/lib/db'

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
      const { bookRepository } = await import('@domain/repositories')

      try {
        const response = await client.get(`/books/${bookId}`)
        const book = bookOutSchema.parse(response.data)
        const localBook = bookOutToLocalBook(book)

        await bookRepository.save(localBook)

        const saved = (await bookRepository.getById(bookId)) ?? localBook

        return [
          bookId,
          {
            id: saved.id,
            title: saved.title,
            author_id: saved.authorId,
            description: saved.description ?? null,
            cover_key: saved.coverKey ?? null,
            file_key: saved.fileKey ?? null,
            file_format: saved.fileFormat ?? null,
            file_size_bytes: saved.fileSizeBytes ?? null,
            status: saved.status,
            is_in_subscription: saved.isInSubscription,
            subscription_payout_amount: saved.subscriptionPayoutAmount ?? null,
            is_for_sale: saved.isForSale,
            sale_price: saved.salePrice ?? null,
            rejection_reason: saved.rejectionReason ?? null,
            published_at: saved.publishedAt ?? null,
            reader_processing_status: saved.readerProcessingStatus ?? 'none',
            reader_processing_error: saved.readerProcessingError ?? null,
            reader_manifest_version: saved.readerManifestVersion ?? 0,
            created_at: saved.createdAt ?? saved.cachedAt,
            updated_at: saved.updatedAt ?? saved.cachedAt,
            average_rating: saved.averageRating ?? null,
            ratings_count: saved.ratingsCount,
            reviews_count: saved.reviewsCount,
            my_rating: saved.myRating ?? null,
          },
        ] as const
      } catch {
        const local = await bookRepository.getById(bookId)

        if (!local) {
          return null
        }

        const book: BookOut = {
          id: local.id,
          title: local.title,
          author_id: local.authorId,
          description: local.description ?? null,
          cover_key: local.coverKey,
          file_key: local.fileKey ?? null,
          file_format: local.fileFormat ?? null,
          file_size_bytes: local.fileSizeBytes ?? null,
          status: local.status,
          is_in_subscription: local.isInSubscription,
          subscription_payout_amount: local.subscriptionPayoutAmount ?? null,
          is_for_sale: local.isForSale,
          sale_price: local.salePrice,
          rejection_reason: local.rejectionReason ?? null,
          published_at: local.publishedAt ?? null,
          reader_processing_status: local.readerProcessingStatus ?? 'none',
          reader_processing_error: local.readerProcessingError ?? null,
          reader_manifest_version: local.readerManifestVersion ?? 0,
          created_at: local.createdAt ?? local.cachedAt,
          updated_at: local.updatedAt ?? local.cachedAt,
          average_rating: local.averageRating,
          ratings_count: local.ratingsCount,
          reviews_count: local.reviewsCount,
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
