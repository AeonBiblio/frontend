import { db } from '@shared/lib/db'
import type {
  AnnotationType,
  DownloadStatus,
  ID,
  LocalAnnotation,
  LocalBookAsset,
  LocalBookChapter,
  LocalDownloadState,
  LocalPdfBook,
  LocalPdfProgress,
  LocalReaderManifest,
  LocalReaderSettings,
  LocalReaderTocItem,
  LocalReadingProgress,
  LocalSearchIndex,
} from '@shared/lib/db'

import type { EntityRepository } from '../entity-repository'
import { createEntityRepository } from './factory'

export type BookChapterRepository = EntityRepository<LocalBookChapter, ID> & {
  getByBookId: (bookId: ID) => Promise<LocalBookChapter[]>
  getByBookAndIndex: (
    bookId: ID,
    index: number,
  ) => Promise<LocalBookChapter | undefined>
  getByBookAndOrder: (
    bookId: ID,
    order: number,
  ) => Promise<LocalBookChapter | undefined>
}

export const bookChapterRepository: BookChapterRepository = {
  ...createEntityRepository(db.bookChapters),
  getByBookId(bookId) {
    return db.bookChapters.where('bookId').equals(bookId).sortBy('index')
  },
  getByBookAndIndex(bookId, index) {
    return db.bookChapters
      .where('[bookId+index]')
      .equals([bookId, index])
      .first()
  },
  getByBookAndOrder(bookId, order) {
    return this.getByBookAndIndex(bookId, order)
  },
}

export type BookAssetRepository = EntityRepository<LocalBookAsset, ID> & {
  getByBookId: (bookId: ID) => Promise<LocalBookAsset[]>
  getByChapterId: (chapterId: ID) => Promise<LocalBookAsset[]>
  getByHref: (bookId: ID, href: string) => Promise<LocalBookAsset | undefined>
}

export const bookAssetRepository: BookAssetRepository = {
  ...createEntityRepository(db.bookAssets),
  getByBookId(bookId) {
    return db.bookAssets.where('bookId').equals(bookId).toArray()
  },
  getByChapterId(chapterId) {
    return db.bookAssets.where('chapterId').equals(chapterId).toArray()
  },
  getByHref(bookId, href) {
    return db.bookAssets
      .where('bookId')
      .equals(bookId)
      .filter((asset) => asset.href === href)
      .first()
  },
}

export type ReaderManifestRepository = EntityRepository<
  LocalReaderManifest,
  ID
> & {
  getByFormat: (
    format: LocalReaderManifest['format'],
  ) => Promise<LocalReaderManifest[]>
  getReady: () => Promise<LocalReaderManifest[]>
}

export const readerManifestRepository: ReaderManifestRepository = {
  ...createEntityRepository(db.readerManifests),
  getByFormat(format) {
    return db.readerManifests.where('format').equals(format).toArray()
  },
  getReady() {
    return db.readerManifests
      .where('processingStatus')
      .equals('ready')
      .toArray()
  },
}

export type ReaderTocItemRepository = EntityRepository<
  LocalReaderTocItem,
  ID
> & {
  getByBookId: (bookId: ID) => Promise<LocalReaderTocItem[]>
  getByBookAndManifestVersion: (
    bookId: ID,
    manifestVersion: number,
  ) => Promise<LocalReaderTocItem[]>
  getRootItems: (bookId: ID) => Promise<LocalReaderTocItem[]>
}

export const readerTocItemRepository: ReaderTocItemRepository = {
  ...createEntityRepository(db.readerTocItems),
  getByBookId(bookId) {
    return db.readerTocItems.where('bookId').equals(bookId).sortBy('order')
  },
  getByBookAndManifestVersion(bookId, manifestVersion) {
    return db.readerTocItems
      .where('[bookId+manifestVersion]')
      .equals([bookId, manifestVersion])
      .sortBy('order')
  },
  getRootItems(bookId) {
    return db.readerTocItems
      .where('bookId')
      .equals(bookId)
      .filter((item) => item.parentId == null)
      .sortBy('order')
  },
}

export type PdfBookRepository = EntityRepository<LocalPdfBook, ID> & {
  getDownloaded: () => Promise<LocalPdfBook[]>
}

export const pdfBookRepository: PdfBookRepository = {
  ...createEntityRepository(db.pdfBooks),
  getDownloaded() {
    return db.pdfBooks.where('isFullyDownloaded').equals(1).toArray()
  },
}

export type PdfProgressRepository = EntityRepository<LocalPdfProgress, ID>

export const pdfProgressRepository: PdfProgressRepository = {
  ...createEntityRepository(db.pdfProgress),
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
