import { db } from '@shared/lib/db'
import type {
  ID,
  LocalReadlist,
  LocalReadlistItem,
  LocalReview,
  ReviewSentiment,
} from '@shared/lib/db'

import type { EntityRepository } from '../entity-repository'
import { createEntityRepository } from './factory'

export type ReviewRepository = EntityRepository<LocalReview, ID> & {
  getByBookId: (bookId: ID) => Promise<LocalReview[]>
  getByBookAndUser: (bookId: ID, userId: ID) => Promise<LocalReview | undefined>
  getBySentiment: (
    bookId: ID,
    sentiment: ReviewSentiment,
  ) => Promise<LocalReview[]>
  getDirty: () => Promise<LocalReview[]>
}

export const reviewRepository: ReviewRepository = {
  ...createEntityRepository(db.reviews),
  getByBookId(bookId) {
    return db.reviews.where('bookId').equals(bookId).toArray()
  },
  getByBookAndUser(bookId, userId) {
    return db.reviews.where('[bookId+userId]').equals([bookId, userId]).first()
  },
  getBySentiment(bookId, sentiment) {
    return db.reviews
      .where('bookId')
      .equals(bookId)
      .filter((review) => review.sentiment === sentiment)
      .toArray()
  },
  getDirty() {
    return db.reviews.filter((review) => review.dirty).toArray()
  },
}

export type ReadlistRepository = EntityRepository<LocalReadlist, ID> & {
  getByUserId: (userId: ID) => Promise<LocalReadlist[]>
  getPublic: () => Promise<LocalReadlist[]>
  getDirty: () => Promise<LocalReadlist[]>
}

export const readlistRepository: ReadlistRepository = {
  ...createEntityRepository(db.readlists),
  getByUserId(userId) {
    return db.readlists.where('userId').equals(userId).toArray()
  },
  getPublic() {
    return db.readlists.filter((readlist) => readlist.isPublic).toArray()
  },
  getDirty() {
    return db.readlists.filter((readlist) => readlist.dirty).toArray()
  },
}

export type ReadlistItemRepository = EntityRepository<LocalReadlistItem, ID> & {
  getByReadlistId: (readlistId: ID) => Promise<LocalReadlistItem[]>
  getByReadlistAndBook: (
    readlistId: ID,
    bookId: ID,
  ) => Promise<LocalReadlistItem | undefined>
  getDirty: () => Promise<LocalReadlistItem[]>
}

export const readlistItemRepository: ReadlistItemRepository = {
  ...createEntityRepository(db.readlistItems),
  getByReadlistId(readlistId) {
    return db.readlistItems.where('readlistId').equals(readlistId).toArray()
  },
  getByReadlistAndBook(readlistId, bookId) {
    return db.readlistItems
      .where('[readlistId+bookId]')
      .equals([readlistId, bookId])
      .first()
  },
  getDirty() {
    return db.readlistItems.filter((item) => item.dirty).toArray()
  },
}
