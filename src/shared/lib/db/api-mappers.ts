import type {
  BookAccessOut,
  GenreTagOut,
  BookListItem,
  BookOut,
  ReaderChapter,
  ReaderManifest,
  ReadlistItemOut,
  ReadlistOut,
  RecentLibraryItem,
  ReviewOut,
  UserBookStatusOut,
  UserOut,
} from '@shared/api/core/schemas'
import type {
  ID,
  LocalBook,
  LocalBookAccess,
  LocalBookAsset,
  LocalBookChapter,
  LocalBookGenreTag,
  LocalBookState,
  LocalGenreTag,
  LocalReadlist,
  LocalReadlistItem,
  LocalReview,
  LocalUserProfile,
} from './types'

const cachedAt = () => new Date().toISOString()

export function userOutToLocalUserProfile(user: UserOut): LocalUserProfile {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayTag: user.display_tag,
    avatarKey: user.avatar_key,
    role: user.role,
    isEmailVerified: user.is_email_verified,
    createdAt: user.created_at,
    cachedAt: cachedAt(),
  }
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

export function bookOutToLocalBook(book: BookOut): LocalBook {
  return {
    ...bookListItemToLocalBook(book),
    description: book.description ?? null,
    fileKey: book.file_key ?? null,
    fileFormat: book.file_format ?? null,
    fileSizeBytes: book.file_size_bytes ?? null,
    subscriptionPayoutAmount: book.subscription_payout_amount ?? null,
    rejectionReason: book.rejection_reason ?? null,
    readerProcessingStatus: book.reader_processing_status,
    readerProcessingError: book.reader_processing_error ?? null,
    readerManifestVersion: book.reader_manifest_version,
    createdAt: book.created_at,
    updatedAt: book.updated_at,
    myRating: book.my_rating ?? null,
  }
}

export function readerManifestToLocalBookChapters(
  manifest: ReaderManifest,
): LocalBookChapter[] {
  return manifest.chapters.map((chapter) => ({
    id: chapter.id,
    bookId: manifest.book_id,
    index: chapter.index,
    order: chapter.index,
    title: chapter.title ?? null,
    sizeBytes: chapter.size_bytes,
    href: chapter.href,
    assetIds: chapter.asset_ids,
    cachedAt: cachedAt(),
  }))
}

export function readerManifestToLocalBookAssets(
  manifest: ReaderManifest,
): LocalBookAsset[] {
  return manifest.assets.map((asset) => ({
    id: asset.id,
    bookId: manifest.book_id,
    href: asset.href,
    cachedAt: cachedAt(),
  }))
}

export function readerChapterToLocalBookChapter(
  chapter: ReaderChapter,
): LocalBookChapter {
  return {
    id: chapter.id,
    bookId: chapter.book_id,
    index: chapter.index,
    order: chapter.index,
    title: chapter.title ?? null,
    contentType: chapter.content_type,
    content:
      chapter.html ??
      chapter.text ??
      (chapter.json === undefined ? undefined : JSON.stringify(chapter.json)),
    assetIds: chapter.asset_ids,
    cachedAt: cachedAt(),
  }
}

export function bookAccessOutToLocalBookAccess(
  access: BookAccessOut,
  userId: ID,
  bookId: ID,
): LocalBookAccess {
  return {
    id: `${userId}:${bookId}`,
    userId,
    bookId,
    source: access.source ?? undefined,
    canRead: access.can_read,
    reason: access.reason,
    fileSizeBytes: access.file_size_bytes ?? null,
    fileFormat: access.file_format ?? null,
    updatedAt: cachedAt(),
  }
}

export function genreTagOutToLocalGenreTag(tag: GenreTagOut): LocalGenreTag {
  return {
    id: tag.id,
    name: tag.name,
    createdAt: cachedAt(),
  }
}

export function genreTagsToLocalBookGenreTags(
  bookId: ID,
  tags: GenreTagOut[],
): LocalBookGenreTag[] {
  return tags.map((tag) => ({
    bookId,
    genreTagId: tag.id,
  }))
}

export function readlistOutToLocalReadlist(
  readlist: ReadlistOut,
): LocalReadlist {
  return {
    id: readlist.id,
    userId: readlist.user_id,
    title: readlist.title,
    description: readlist.description ?? null,
    isPublic: readlist.is_public,
    createdAt: readlist.created_at,
    updatedAt: readlist.updated_at,
    dirty: false,
  }
}

export function readlistItemOutToLocalReadlistItem(
  item: ReadlistItemOut,
): LocalReadlistItem {
  return {
    id: item.id,
    readlistId: item.readlist_id,
    bookId: item.book_id,
    addedAt: item.added_at,
    dirty: false,
  }
}

export function userBookStatusOutToLocalBookState(
  item: UserBookStatusOut,
): LocalBookState {
  return {
    id: item.id,
    userId: item.user_id,
    bookId: item.book_id,
    status: item.status,
    progressPercent: item.progress_percent ?? 0,
    updatedAt: item.updated_at,
    dirty: false,
  }
}

export function reviewOutToLocalReview(
  review: ReviewOut,
  bookId: ID,
): LocalReview {
  return {
    id: review.id,
    bookId,
    userId: review.user_id,
    username: review.username,
    displayTag: review.display_tag,
    avatarKey: review.avatar_key,
    rating: review.rating,
    sentiment: review.sentiment,
    text: review.text,
    promoIssued: review.promo_issued,
    likesCount: review.likes_count,
    dislikesCount: review.dislikes_count,
    myVote: review.my_vote,
    createdAt: review.created_at,
    dirty: false,
  }
}

export function recentLibraryItemToLocalBookState(
  item: RecentLibraryItem,
  userId: ID,
): LocalBookState {
  return {
    id: `${userId}:${item.book_id}`,
    userId,
    bookId: item.book_id,
    status: item.status,
    progressPercent: item.progress_percent,
    updatedAt: item.updated_at,
    dirty: false,
  }
}
