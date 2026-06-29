import { db } from '@shared/lib/db'
import type {
  BookFormat,
  BookStatus,
  ID,
  LocalBook,
  LocalBookAccess,
  LocalBookGenreTag,
  LocalBookState,
  LocalGenreTag,
  LocalUserProfile,
  ReaderProcessingStatus,
  ReadingStatus,
} from '@shared/lib/db'

import type { EntityRepository } from '../entity-repository'
import { createEntityRepository } from './factory'

export type UserProfileRepository = EntityRepository<LocalUserProfile, ID> & {
  getByEmail: (email: string) => Promise<LocalUserProfile | undefined>
  getByUsername: (username: string) => Promise<LocalUserProfile | undefined>
  getByRole: (role: LocalUserProfile['role']) => Promise<LocalUserProfile[]>
}

export const userProfileRepository: UserProfileRepository = {
  ...createEntityRepository(db.userProfiles),
  getByEmail(email) {
    return db.userProfiles.where('email').equals(email).first()
  },
  getByUsername(username) {
    return db.userProfiles.where('username').equals(username).first()
  },
  getByRole(role) {
    return db.userProfiles.where('role').equals(role).toArray()
  },
}

export type BookRepository = EntityRepository<LocalBook, ID> & {
  getByAuthorId: (authorId: ID) => Promise<LocalBook[]>
  getByStatus: (status: BookStatus) => Promise<LocalBook[]>
  getByFormat: (format: BookFormat) => Promise<LocalBook[]>
  getByReaderProcessingStatus: (
    status: ReaderProcessingStatus,
  ) => Promise<LocalBook[]>
  getInSubscription: () => Promise<LocalBook[]>
  getForSale: () => Promise<LocalBook[]>
  searchByTitle: (query: string) => Promise<LocalBook[]>
}

export const bookRepository: BookRepository = {
  ...createEntityRepository(db.books),
  getByAuthorId(authorId) {
    return db.books.where('authorId').equals(authorId).toArray()
  },
  getByStatus(status) {
    return db.books.where('status').equals(status).toArray()
  },
  getByFormat(format) {
    return db.books.where('fileFormat').equals(format).toArray()
  },
  getByReaderProcessingStatus(status) {
    return db.books.where('readerProcessingStatus').equals(status).toArray()
  },
  getInSubscription() {
    return db.books.where('isInSubscription').equals(1).toArray()
  },
  getForSale() {
    return db.books.where('isForSale').equals(1).toArray()
  },
  searchByTitle(query) {
    const normalizedQuery = query.trim().toLocaleLowerCase()

    if (!normalizedQuery) {
      return db.books.toArray()
    }

    return db.books
      .filter((book) =>
        book.title.toLocaleLowerCase().includes(normalizedQuery),
      )
      .toArray()
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
  getReadableByUserId: (userId: ID) => Promise<LocalBookAccess[]>
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
  getReadableByUserId(userId) {
    return db.bookAccess
      .where('userId')
      .equals(userId)
      .filter((access) => access.canRead)
      .toArray()
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
