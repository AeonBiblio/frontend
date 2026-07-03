import type {
  BookAccessOut,
  GenreTagOut,
  BookListItem,
  BookOut,
  BookRatingOut,
} from '@shared/api/core'
import { db } from '@shared/lib/db'
import type { LocalBook, LocalBookAccess, LocalGenreTag } from '@shared/lib/db'

import type { BookFilters } from '@modules/books/model'

export const bookKeys = {
  list: (filters: BookFilters) => ['books', 'list', filters] as const,
  recommendations: (limit: number) =>
    ['books', 'recommendations', limit] as const,
  details: (bookId: string) => ['books', bookId] as const,
  rating: (bookId: string) => ['books', bookId, 'rating'] as const,
  access: (bookId: string) => ['books', bookId, 'access'] as const,
  readerManifest: (bookId: string) =>
    ['books', bookId, 'reader-manifest'] as const,
  readerToc: (bookId: string, manifestVersion: number | undefined) =>
    ['books', bookId, 'reader-toc', manifestVersion] as const,
  readerChapter: (bookId: string, chapterId: string) =>
    ['books', bookId, 'chapters', chapterId] as const,
  readerAsset: (bookId: string, assetId: string) =>
    ['books', bookId, 'assets', assetId] as const,
}

export const genreTagKeys = {
  all: ['genre-tags'] as const,
  book: (bookId: string) => ['books', bookId, 'genre-tags'] as const,
}

export const cleanBookParams = (filters: BookFilters) => ({
  q: filters.q || undefined,
  status: filters.status || undefined,
  author_id: filters.author_id || undefined,
  genre_tag_id: filters.genre_tag_id || undefined,
  in_subscription: filters.in_subscription,
  for_sale: filters.for_sale,
  offset: filters.offset,
  limit: filters.limit,
})

const cachedAt = () => new Date().toISOString()

function scheduleBackgroundTask(task: () => Promise<void>) {
  if (typeof window === 'undefined') {
    return
  }

  const run = () => {
    void task().catch(() => undefined)
  }
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 10_000 })
    return
  }

  window.setTimeout(run, 4_000)
}

export function bookListItemToLocalBook(book: BookListItem): LocalBook {
  return {
    id: book.id,
    title: book.title,
    authorId: book.author_id,
    authorName:
      book.author_display_name ??
      book.author_name ??
      book.author_username ??
      undefined,
    description: book.description ?? null,
    coverKey: book.cover_key ?? null,
    fileKey: book.file_key ?? null,
    fileFormat: book.file_format ?? null,
    fileSizeBytes: book.file_size_bytes ?? null,
    status: book.status,
    isInSubscription: book.is_in_subscription,
    subscriptionPayoutAmount: book.subscription_payout_amount ?? null,
    isForSale: book.is_for_sale,
    salePrice: book.sale_price ?? null,
    rejectionReason: book.rejection_reason ?? null,
    publishedAt: book.published_at ?? null,
    readerProcessingStatus: book.reader_processing_status,
    readerProcessingError: book.reader_processing_error ?? null,
    readerManifestVersion: book.reader_manifest_version ?? null,
    createdAt: book.created_at,
    updatedAt: book.updated_at,
    averageRating: book.average_rating ?? null,
    ratingsCount: book.ratings_count,
    reviewsCount: book.reviews_count,
    myRating: book.my_rating ?? null,
    cachedAt: cachedAt(),
  }
}

export function saveBooksInBackground(books: LocalBook[]) {
  if (books.length === 0) {
    return
  }

  scheduleBackgroundTask(async () => {
    const { bookRepository } = await import('@domain/repositories')
    const writableBooks = await Promise.all(
      books.map(async (book) => {
        const [savedBook, pendingRatingCount] = await Promise.all([
          bookRepository.getById(book.id),
          db.outbox
            .where('bookId')
            .equals(book.id)
            .filter(
              (item) =>
                item.type === 'http.request' &&
                item.payload.method === 'put' &&
                item.payload.path === `/books/${book.id}/rating` &&
                item.status !== 'failed',
            )
            .count(),
        ])

        if (!savedBook || pendingRatingCount === 0) {
          return book
        }

        return {
          ...book,
          ratingsCount: savedBook.ratingsCount,
          myRating: savedBook.myRating,
        }
      }),
    )

    await bookRepository.saveMany(writableBooks)
  })
}

export function genreTagOutToLocalGenreTag(tag: GenreTagOut): LocalGenreTag {
  return {
    id: tag.id,
    name: tag.name,
    createdAt: cachedAt(),
  }
}

export function saveGenreTagsInBackground(tags: LocalGenreTag[]) {
  if (tags.length === 0) {
    return
  }

  scheduleBackgroundTask(async () => {
    const { genreTagRepository } = await import('@domain/repositories')

    await genreTagRepository.saveMany(tags)
  })
}

export async function readLocalBooksByFilters(filters: BookFilters) {
  const { bookGenreTagRepository, bookRepository } =
    await import('@domain/repositories')
  let books = await bookRepository.getAll()

  if (filters.q) {
    const query = filters.q.toLocaleLowerCase()
    books = books.filter((book) =>
      book.title.toLocaleLowerCase().includes(query),
    )
  }

  if (filters.status) {
    books = books.filter((book) => book.status === filters.status)
  }

  if (filters.author_id) {
    books = books.filter((book) => book.authorId === filters.author_id)
  }

  if (filters.genre_tag_id) {
    const links = await bookGenreTagRepository.getByGenreTagId(
      filters.genre_tag_id,
    )
    const bookIds = new Set(links.map((link) => link.bookId))
    books = books.filter((book) => bookIds.has(book.id))
  }

  if (typeof filters.in_subscription === 'boolean') {
    books = books.filter(
      (book) => book.isInSubscription === filters.in_subscription,
    )
  }

  if (typeof filters.for_sale === 'boolean') {
    books = books.filter((book) => book.isForSale === filters.for_sale)
  }

  return books.slice(filters.offset, filters.offset + filters.limit)
}

export async function readSavedBooks(ids: string[]) {
  const { bookRepository } = await import('@domain/repositories')
  const books = await Promise.all(ids.map((id) => bookRepository.getById(id)))
  return books.filter((book): book is LocalBook => Boolean(book))
}

export function localBookToBookOut(book: LocalBook): BookOut {
  return {
    id: book.id,
    title: book.title,
    author_id: book.authorId,
    author_name: book.authorName,
    author_username: book.authorName,
    author_display_name: book.authorName,
    description: book.description ?? null,
    cover_key: book.coverKey ?? null,
    file_key: book.fileKey ?? null,
    file_format: book.fileFormat ?? null,
    file_size_bytes: book.fileSizeBytes ?? null,
    status: book.status,
    is_in_subscription: book.isInSubscription,
    subscription_payout_amount: book.subscriptionPayoutAmount ?? null,
    is_for_sale: book.isForSale,
    sale_price: book.salePrice ?? null,
    rejection_reason: book.rejectionReason ?? null,
    published_at: book.publishedAt ?? null,
    reader_processing_status: book.readerProcessingStatus ?? 'none',
    reader_processing_error: book.readerProcessingError ?? null,
    reader_manifest_version: book.readerManifestVersion ?? 0,
    created_at: book.createdAt ?? book.cachedAt,
    updated_at: book.updatedAt ?? book.cachedAt,
    average_rating: book.averageRating ?? null,
    ratings_count: book.ratingsCount,
    reviews_count: book.reviewsCount,
    my_rating: book.myRating ?? null,
  }
}

export function localBookToRating(book: LocalBook): BookRatingOut {
  return {
    average_rating: book.averageRating ?? null,
    ratings_count: book.ratingsCount,
    reviews_count: book.reviewsCount,
    my_rating: book.myRating ?? null,
  }
}

export function localAccessToBookAccessOut(
  access: LocalBookAccess | undefined,
): BookAccessOut | null {
  if (!access) {
    return null
  }

  return {
    can_read: access.canRead,
    reason: access.reason,
    source: access.source,
    file_size_bytes: access.fileSizeBytes ?? null,
    file_format: access.fileFormat ?? null,
    reader_processing_status: access.readerProcessingStatus,
    reader_manifest_version: access.readerManifestVersion ?? undefined,
  }
}
