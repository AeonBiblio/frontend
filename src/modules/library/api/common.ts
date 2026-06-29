import type {
  ReadlistItemOut,
  ReadlistOut,
  RecentLibraryItem,
  UserBookStatusOut,
  UserSubscriptionOut,
} from '@shared/api/core'
import { db } from '@shared/lib/db'
import type {
  LocalBookState,
  LocalReadlist,
  LocalReadlistItem,
  LocalUserSubscription,
} from '@shared/lib/db'

export const libraryKeys = {
  recent: ['library', 'recent'] as const,
  status: ['library', 'status'] as const,
  readlists: ['library', 'readlists'] as const,
  readlistBooks: (readlistId: string) =>
    ['library', 'readlists', readlistId, 'books'] as const,
  enrichedBooks: (bookIds: string[]) =>
    ['library', 'enriched-books', ...[...bookIds].sort()] as const,
  subscriptionMe: ['subscriptions', 'me'] as const,
}

export function localBookStateToStatusOut(
  state: LocalBookState,
): UserBookStatusOut {
  return {
    id: state.id,
    user_id: state.userId,
    book_id: state.bookId,
    status: state.status,
    progress_percent: state.progressPercent,
    updated_at: state.updatedAt,
  }
}

export async function localBookStateToRecentItem(
  state: LocalBookState,
): Promise<RecentLibraryItem> {
  const book = await db.books.get(state.bookId)

  return {
    book_id: state.bookId,
    title: book?.title ?? 'Книга',
    cover_key: book?.coverKey ?? null,
    status: state.status,
    progress_percent: state.progressPercent,
    updated_at: state.updatedAt,
  }
}

export function localReadlistToOut(readlist: LocalReadlist): ReadlistOut {
  return {
    id: readlist.id,
    user_id: readlist.userId,
    title: readlist.title,
    description: readlist.description ?? null,
    is_public: readlist.isPublic,
    created_at: readlist.createdAt,
    updated_at: readlist.updatedAt,
  }
}

export function localReadlistItemToOut(
  item: LocalReadlistItem,
): ReadlistItemOut {
  return {
    id: item.id,
    readlist_id: item.readlistId,
    book_id: item.bookId,
    added_at: item.addedAt,
  }
}

export function localSubscriptionToOut(
  subscription: LocalUserSubscription,
): UserSubscriptionOut {
  return {
    id: subscription.id,
    user_id: subscription.userId,
    plan_id: subscription.planId,
    status: subscription.status,
    started_at: subscription.startedAt,
    expires_at: subscription.expiresAt,
    cancelled_at: subscription.cancelledAt,
    auto_renew: subscription.autoRenew,
  }
}

export function getLocalSubscription(userId: string) {
  return db.userSubscriptions.where('userId').equals(userId).first()
}
