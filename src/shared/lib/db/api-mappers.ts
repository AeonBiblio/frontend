import type {
  BookAccessOut,
  BookListItem,
  BookOut,
  RecentLibraryItem,
  ReviewOut,
  UserOut,
} from '@shared/api/core/schemas'
import type {
  ID,
  LocalBook,
  LocalBookAccess,
  LocalBookState,
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
    coverKey: book.cover_key ?? null,
    status: book.status,
    isInSubscription: book.is_in_subscription,
    isForSale: book.is_for_sale,
    salePrice: book.sale_price ?? null,
    averageRating: book.average_rating ?? null,
    ratingsCount: book.ratings_count,
    reviewsCount: book.reviews_count,
    cachedAt: cachedAt(),
  }
}

export function bookOutToLocalBook(book: BookOut): LocalBook {
  return {
    ...bookListItemToLocalBook(book),
    description: book.description ?? null,
    fileFormat: book.file_format ?? null,
    fileSizeBytes: book.file_size_bytes ?? null,
    myRating: book.my_rating ?? null,
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
    canRead: access.can_read,
    reason: access.reason,
    fileSizeBytes: access.file_size_bytes ?? null,
    fileFormat: access.file_format ?? null,
    updatedAt: cachedAt(),
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
