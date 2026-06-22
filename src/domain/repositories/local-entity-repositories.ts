import type { Table } from 'dexie'

import { db } from '@shared/lib/db'
import type {
  AnnotationType,
  BookStatus,
  DownloadStatus,
  ID,
  LocalAnnotation,
  LocalBook,
  LocalBookAccess,
  LocalBookAsset,
  LocalBookChapter,
  LocalBookGenreTag,
  LocalBookState,
  LocalDownloadState,
  LocalGenreTag,
  LocalOutboxItem,
  LocalReaderSettings,
  LocalReadingProgress,
  LocalReadlist,
  LocalReadlistItem,
  LocalReview,
  LocalSearchIndex,
  LocalSession,
  LocalSyncState,
  LocalUserProfile,
  OutboxStatus,
  ReadingStatus,
  SyncScope,
} from '@shared/lib/db'

import type { EntityRepository } from './entity-repository'

function createEntityRepository<TEntity, TKey, TInsertType>(
  table: Table<TEntity, TKey, TInsertType>,
): EntityRepository<TEntity, TKey> {
  return {
    getById(id) {
      return table.get(id)
    },
    getAll() {
      return table.toArray()
    },
    save(entity) {
      return table.put(entity as unknown as TInsertType)
    },
    async saveMany(entities) {
      return table.bulkPut(entities as unknown as TInsertType[], {
        allKeys: true,
      })
    },
    remove(id) {
      return table.delete(id)
    },
    clear() {
      return table.clear()
    },
  }
}

export type UserProfileRepository = EntityRepository<LocalUserProfile, ID> & {
  getByEmail: (email: string) => Promise<LocalUserProfile | undefined>
  getByUsername: (username: string) => Promise<LocalUserProfile | undefined>
}

export const userProfileRepository: UserProfileRepository = {
  ...createEntityRepository(db.userProfiles),
  getByEmail(email) {
    return db.userProfiles.where('email').equals(email).first()
  },
  getByUsername(username) {
    return db.userProfiles.where('username').equals(username).first()
  },
}

export type BookRepository = EntityRepository<LocalBook, ID> & {
  getByAuthorId: (authorId: ID) => Promise<LocalBook[]>
  getByStatus: (status: BookStatus) => Promise<LocalBook[]>
}

export const bookRepository: BookRepository = {
  ...createEntityRepository(db.books),
  getByAuthorId(authorId) {
    return db.books.where('authorId').equals(authorId).toArray()
  },
  getByStatus(status) {
    return db.books.where('status').equals(status).toArray()
  },
}

export type GenreTagRepository = EntityRepository<LocalGenreTag, ID> & {
  getByName: (name: string) => Promise<LocalGenreTag | undefined>
}

export const genreTagRepository: GenreTagRepository = {
  ...createEntityRepository(db.genreTags),
  getByName(name) {
    return db.genreTags.where('name').equals(name).first()
  },
}

export type BookGenreTagRepository = EntityRepository<
  LocalBookGenreTag,
  [ID, ID]
> & {
  getByBookId: (bookId: ID) => Promise<LocalBookGenreTag[]>
  getByGenreTagId: (genreTagId: ID) => Promise<LocalBookGenreTag[]>
}

export const bookGenreTagRepository: BookGenreTagRepository = {
  ...createEntityRepository(db.bookGenreTags),
  getByBookId(bookId) {
    return db.bookGenreTags.where('bookId').equals(bookId).toArray()
  },
  getByGenreTagId(genreTagId) {
    return db.bookGenreTags.where('genreTagId').equals(genreTagId).toArray()
  },
}

export type BookAccessRepository = EntityRepository<LocalBookAccess, ID> & {
  getByUserAndBook: (
    userId: ID,
    bookId: ID,
  ) => Promise<LocalBookAccess | undefined>
  getByUserId: (userId: ID) => Promise<LocalBookAccess[]>
}

export const bookAccessRepository: BookAccessRepository = {
  ...createEntityRepository(db.bookAccess),
  getByUserAndBook(userId, bookId) {
    return db.bookAccess
      .where('[userId+bookId]')
      .equals([userId, bookId])
      .first()
  },
  getByUserId(userId) {
    return db.bookAccess.where('userId').equals(userId).toArray()
  },
}

export type BookStateRepository = EntityRepository<LocalBookState, ID> & {
  getByUserAndBook: (
    userId: ID,
    bookId: ID,
  ) => Promise<LocalBookState | undefined>
  getByUserAndStatus: (
    userId: ID,
    status: ReadingStatus,
  ) => Promise<LocalBookState[]>
  getDirty: () => Promise<LocalBookState[]>
}

export const bookStateRepository: BookStateRepository = {
  ...createEntityRepository(db.bookStates),
  getByUserAndBook(userId, bookId) {
    return db.bookStates
      .where('[userId+bookId]')
      .equals([userId, bookId])
      .first()
  },
  getByUserAndStatus(userId, status) {
    return db.bookStates
      .where('userId')
      .equals(userId)
      .filter((state) => state.status === status)
      .toArray()
  },
  getDirty() {
    return db.bookStates.filter((state) => state.dirty).toArray()
  },
}

export type ReviewRepository = EntityRepository<LocalReview, ID> & {
  getByBookId: (bookId: ID) => Promise<LocalReview[]>
  getByBookAndUser: (bookId: ID, userId: ID) => Promise<LocalReview | undefined>
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

export type BookChapterRepository = EntityRepository<LocalBookChapter, ID> & {
  getByBookId: (bookId: ID) => Promise<LocalBookChapter[]>
  getByBookAndOrder: (
    bookId: ID,
    order: number,
  ) => Promise<LocalBookChapter | undefined>
}

export const bookChapterRepository: BookChapterRepository = {
  ...createEntityRepository(db.bookChapters),
  getByBookId(bookId) {
    return db.bookChapters.where('bookId').equals(bookId).sortBy('order')
  },
  getByBookAndOrder(bookId, order) {
    return db.bookChapters
      .where('[bookId+order]')
      .equals([bookId, order])
      .first()
  },
}

export type BookAssetRepository = EntityRepository<LocalBookAsset, ID> & {
  getByBookId: (bookId: ID) => Promise<LocalBookAsset[]>
  getByChapterId: (chapterId: ID) => Promise<LocalBookAsset[]>
}

export const bookAssetRepository: BookAssetRepository = {
  ...createEntityRepository(db.bookAssets),
  getByBookId(bookId) {
    return db.bookAssets.where('bookId').equals(bookId).toArray()
  },
  getByChapterId(chapterId) {
    return db.bookAssets.where('chapterId').equals(chapterId).toArray()
  },
}

export type ReadingProgressRepository = EntityRepository<
  LocalReadingProgress,
  ID
> & {
  getByUserAndBook: (
    userId: ID,
    bookId: ID,
  ) => Promise<LocalReadingProgress | undefined>
  getDirty: () => Promise<LocalReadingProgress[]>
}

export const readingProgressRepository: ReadingProgressRepository = {
  ...createEntityRepository(db.readingProgress),
  getByUserAndBook(userId, bookId) {
    return db.readingProgress
      .where('[userId+bookId]')
      .equals([userId, bookId])
      .first()
  },
  getDirty() {
    return db.readingProgress.filter((progress) => progress.dirty).toArray()
  },
}

export type ReaderSettingsRepository = EntityRepository<
  LocalReaderSettings,
  ID
> & {
  getByUserAndBook: (
    userId: ID,
    bookId: ID,
  ) => Promise<LocalReaderSettings | undefined>
  getForUser: (userId: ID) => Promise<LocalReaderSettings[]>
  getDirty: () => Promise<LocalReaderSettings[]>
}

export const readerSettingsRepository: ReaderSettingsRepository = {
  ...createEntityRepository(db.readerSettings),
  getByUserAndBook(userId, bookId) {
    return db.readerSettings
      .where('[userId+bookId]')
      .equals([userId, bookId])
      .first()
  },
  getForUser(userId) {
    return db.readerSettings.where('userId').equals(userId).toArray()
  },
  getDirty() {
    return db.readerSettings.filter((settings) => settings.dirty).toArray()
  },
}

export type AnnotationRepository = EntityRepository<LocalAnnotation, ID> & {
  getByBookId: (bookId: ID) => Promise<LocalAnnotation[]>
  getByChapterId: (chapterId: ID) => Promise<LocalAnnotation[]>
  getByType: (type: AnnotationType) => Promise<LocalAnnotation[]>
  getDirty: () => Promise<LocalAnnotation[]>
}

export const annotationRepository: AnnotationRepository = {
  ...createEntityRepository(db.annotations),
  getByBookId(bookId) {
    return db.annotations.where('bookId').equals(bookId).toArray()
  },
  getByChapterId(chapterId) {
    return db.annotations.where('chapterId').equals(chapterId).toArray()
  },
  getByType(type) {
    return db.annotations.where('type').equals(type).toArray()
  },
  getDirty() {
    return db.annotations.filter((annotation) => annotation.dirty).toArray()
  },
}

export type DownloadStateRepository = EntityRepository<
  LocalDownloadState,
  ID
> & {
  getByStatus: (status: DownloadStatus) => Promise<LocalDownloadState[]>
}

export const downloadStateRepository: DownloadStateRepository = {
  ...createEntityRepository(db.downloadStates),
  getByStatus(status) {
    return db.downloadStates.where('status').equals(status).toArray()
  },
}

export type SearchIndexRepository = EntityRepository<LocalSearchIndex, ID> & {
  getByBookId: (bookId: ID) => Promise<LocalSearchIndex[]>
  getByBookAndChapter: (
    bookId: ID,
    chapterId: ID,
  ) => Promise<LocalSearchIndex | undefined>
}

export const searchIndexRepository: SearchIndexRepository = {
  ...createEntityRepository(db.searchIndex),
  getByBookId(bookId) {
    return db.searchIndex.where('bookId').equals(bookId).toArray()
  },
  getByBookAndChapter(bookId, chapterId) {
    return db.searchIndex
      .where('[bookId+chapterId]')
      .equals([bookId, chapterId])
      .first()
  },
}

export type OutboxEntityRepository = EntityRepository<LocalOutboxItem, ID> & {
  getByStatus: (status: OutboxStatus) => Promise<LocalOutboxItem[]>
  getByEntity: (
    type: LocalOutboxItem['type'],
    entityId: ID,
  ) => Promise<LocalOutboxItem[]>
}

export const outboxEntityRepository: OutboxEntityRepository = {
  ...createEntityRepository(db.outbox),
  getByStatus(status) {
    return db.outbox.where('status').equals(status).toArray()
  },
  getByEntity(type, entityId) {
    return db.outbox.where('[type+entityId]').equals([type, entityId]).toArray()
  },
}

export type SyncStateRepository = EntityRepository<LocalSyncState, ID> & {
  getByScope: (scope: SyncScope) => Promise<LocalSyncState | undefined>
}

export const syncStateRepository: SyncStateRepository = {
  ...createEntityRepository(db.syncState),
  getByScope(scope) {
    return db.syncState.where('scope').equals(scope).first()
  },
}

export type SessionRepository = EntityRepository<
  LocalSession,
  LocalSession['key']
> & {
  getCurrent: () => Promise<LocalSession | undefined>
  setCurrent: (session: LocalSession) => Promise<LocalSession['key']>
  clearCurrent: () => Promise<void>
}

export const sessionRepository: SessionRepository = {
  ...createEntityRepository(db.session),
  getCurrent() {
    return db.session.get('current')
  },
  setCurrent(session) {
    return db.session.put(session)
  },
  clearCurrent() {
    return db.session.delete('current')
  },
}
