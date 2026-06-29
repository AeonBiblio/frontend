import Dexie from 'dexie'
import type { EntityTable, Table } from 'dexie'

import type {
  ID,
  LocalUserProfile,
  LocalBook,
  LocalGenreTag,
  LocalBookGenreTag,
  LocalBookAccess,
  LocalBookState,
  LocalReview,
  LocalReadlist,
  LocalReadlistItem,
  LocalBookChapter,
  LocalBookAsset,
  LocalPdfBook,
  LocalPdfProgress,
  LocalReadingProgress,
  LocalReaderSettings,
  LocalAnnotation,
  LocalDownloadState,
  LocalSearchIndex,
  LocalOutboxItem,
  LocalSyncState,
  LocalSession,
  LocalPaymentProfile,
  LocalUserSubscription,
  LocalEarningsBalance,
  LocalPromoCode,
} from './types'

import { LOCAL_DB_STORES } from './types'

export class AppDB extends Dexie {
  userProfiles!: EntityTable<LocalUserProfile, 'id'>
  books!: EntityTable<LocalBook, 'id'>
  genreTags!: EntityTable<LocalGenreTag, 'id'>
  bookGenreTags!: Table<LocalBookGenreTag, [ID, ID]>
  bookAccess!: EntityTable<LocalBookAccess, 'id'>
  bookStates!: EntityTable<LocalBookState, 'id'>
  reviews!: EntityTable<LocalReview, 'id'>
  readlists!: EntityTable<LocalReadlist, 'id'>
  readlistItems!: EntityTable<LocalReadlistItem, 'id'>
  bookChapters!: EntityTable<LocalBookChapter, 'id'>
  bookAssets!: EntityTable<LocalBookAsset, 'id'>
  pdfBooks!: EntityTable<LocalPdfBook, 'bookId'>
  pdfProgress!: EntityTable<LocalPdfProgress, 'bookId'>
  readingProgress!: EntityTable<LocalReadingProgress, 'id'>
  readerSettings!: EntityTable<LocalReaderSettings, 'id'>
  annotations!: EntityTable<LocalAnnotation, 'id'>
  downloadStates!: EntityTable<LocalDownloadState, 'bookId'>
  searchIndex!: EntityTable<LocalSearchIndex, 'id'>
  outbox!: EntityTable<LocalOutboxItem, 'id'>
  syncState!: EntityTable<LocalSyncState, 'id'>
  session!: EntityTable<LocalSession, 'key'>
  paymentProfiles!: EntityTable<LocalPaymentProfile, 'userId'>
  userSubscriptions!: EntityTable<LocalUserSubscription, 'id'>
  earningsBalances!: EntityTable<LocalEarningsBalance, 'userId'>
  promoCodes!: EntityTable<LocalPromoCode, 'id'>

  constructor() {
    super('app-db')

    this.version(1).stores(LOCAL_DB_STORES)
    this.version(2).stores(LOCAL_DB_STORES)
    this.version(3).stores(LOCAL_DB_STORES)
    this.version(4).stores(LOCAL_DB_STORES)
  }
}

export const db = new AppDB()
