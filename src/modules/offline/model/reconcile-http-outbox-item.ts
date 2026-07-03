import {
  bookRatingOutSchema,
  readlistItemOutSchema,
  readlistOutSchema,
  reviewOutSchema,
  userOutSchema,
} from '@shared/api/core'
import {
  db,
  readlistItemOutToLocalReadlistItem,
  readlistOutToLocalReadlist,
  reviewOutToLocalReview,
  userOutToLocalUserProfile,
} from '@shared/lib/db'

import type { LocalOutboxItem } from '@shared/lib/db'

export async function reconcileDeliveredHttpOutboxItem(
  item: LocalOutboxItem<'http.request'>,
  responseData: unknown,
) {
  const { method, path } = item.payload

  if (path.endsWith('/vote')) {
    return
  }

  if (method === 'delete') {
    if (path.startsWith('/reviews/')) {
      await db.reviews.delete(item.entityId)
      return
    }

    if (path.includes('/books/')) {
      await db.readlistItems.delete(item.entityId)
      return
    }

    if (path.startsWith('/library/readlists/')) {
      await db.readlists.delete(item.entityId)
    }

    return
  }

  if (path === '/users/me' && method === 'patch') {
    const user = userOutToLocalUserProfile(userOutSchema.parse(responseData))

    await db.userProfiles.put(user)
    return
  }

  if (path.endsWith('/rating') && method === 'put' && item.bookId) {
    const rating = bookRatingOutSchema.parse(responseData)
    const book = await db.books.get(item.bookId)

    if (!book) {
      return
    }

    await db.books.put({
      ...book,
      averageRating: rating.average_rating,
      ratingsCount: rating.ratings_count,
      reviewsCount: rating.reviews_count,
      myRating: rating.my_rating ?? null,
      cachedAt: new Date().toISOString(),
    })
    return
  }

  if (path.includes('/reviews') || path.startsWith('/reviews/')) {
    const review = reviewOutSchema.parse(responseData)

    if (!item.bookId) {
      return
    }

    const localReview = reviewOutToLocalReview(review, item.bookId)

    await db.transaction('rw', db.reviews, async () => {
      if (localReview.id !== item.entityId) {
        await db.reviews.delete(item.entityId)
      }

      await db.reviews.put(localReview)
    })
    return
  }

  if (path.endsWith('/books') && method === 'post') {
    const readlistItem = readlistItemOutToLocalReadlistItem(
      readlistItemOutSchema.parse(responseData),
    )

    await db.transaction('rw', db.readlistItems, async () => {
      if (readlistItem.id !== item.entityId) {
        await db.readlistItems.delete(item.entityId)
      }

      await db.readlistItems.put(readlistItem)
    })
    return
  }

  if (path.startsWith('/library/readlists')) {
    const readlist = readlistOutToLocalReadlist(
      readlistOutSchema.parse(responseData),
    )

    await db.transaction('rw', db.readlists, async () => {
      if (readlist.id !== item.entityId) {
        await db.readlists.delete(item.entityId)
      }

      await db.readlists.put(readlist)
    })
  }
}
