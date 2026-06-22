import type { Table } from 'dexie'

export type ID = string
export type ISODateTime = string
export type DecimalString = string

export type BookStatus = 'draft' | 'pending' | 'published' | 'rejected'
export type ReadingStatus = 'reading' | 'finished' | 'wishlist'
export type BookFormat = 'fb2' | 'epub' | 'pdf' | (string & {})
export type ReadingMode = 'reflowable' | 'fixed-layout'
export type BookAccessSource = 'free' | 'purchase' | 'subscription' | 'author'
export type ChapterContentType = 'html' | 'text' | 'json'
export type BookAssetKind = 'cover' | 'image' | 'font' | 'stylesheet' | 'other'
export type ReaderTheme = 'light' | 'dark' | 'sepia' | 'system'
export type ReaderPageMode = 'scroll' | 'paginated'
export type TextAlignMode = 'left' | 'justify'
export type AnnotationType = 'bookmark' | 'highlight' | 'note'
export type AnnotationColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple'
export type DownloadStatus =
  | 'idle'
  | 'queued'
  | 'downloading'
  | 'downloaded'
  | 'failed'
  | 'removed'
export type OutboxStatus =
  | 'pending'
  | 'processing'
  | 'failed'
  | 'retry_scheduled'
  | 'bg_sync_queued'
export type OutboxType =
  | 'progress.update'
  | 'book-state.update'
  | 'reader-settings.update'
  | 'annotation.create'
  | 'annotation.update'
  | 'annotation.delete'
  | 'readlist.create'
  | 'readlist.update'
  | 'readlist.delete'
  | 'readlist-item.create'
  | 'readlist-item.delete'
  | 'review.create'
  | 'review.update'
  | 'review.delete'

export type OutboxEntityKind =
  | 'progress'
  | 'book-state'
  | 'reader-settings'
  | 'annotation'
  | 'readlist'
  | 'readlist-item'
  | 'review'

export type OutboxEventPayloadMap = {
  'progress.update': LocalReadingProgress
  'book-state.update': LocalBookState
  'reader-settings.update': LocalReaderSettings
  'annotation.create': LocalAnnotation
  'annotation.update': LocalAnnotation
  'annotation.delete': Pick<LocalAnnotation, 'id'>
  'readlist.create': LocalReadlist
  'readlist.update': LocalReadlist
  'readlist.delete': Pick<LocalReadlist, 'id'>
  'readlist-item.create': LocalReadlistItem
  'readlist-item.delete': Pick<LocalReadlistItem, 'id' | 'readlistId'>
  'review.create': LocalReview
  'review.update': LocalReview
  'review.delete': Pick<LocalReview, 'id'>
}

export type OutboxEntityKindMap = {
  'progress.update': 'progress'
  'book-state.update': 'book-state'
  'reader-settings.update': 'reader-settings'
  'annotation.create': 'annotation'
  'annotation.update': 'annotation'
  'annotation.delete': 'annotation'
  'readlist.create': 'readlist'
  'readlist.update': 'readlist'
  'readlist.delete': 'readlist'
  'readlist-item.create': 'readlist-item'
  'readlist-item.delete': 'readlist-item'
  'review.create': 'review'
  'review.update': 'review'
  'review.delete': 'review'
}

export type SyncScope =
  | 'library'
  | 'progress'
  | 'reader-settings'
  | 'annotations'
  | 'readlists'
  | 'reviews'
  | 'outbox'

export type SerializedTextRange = {
  startContainerPath: number[]
  startOffset: number
  endContainerPath: number[]
  endOffset: number
  cfi?: string
}

export type LocalUserProfile = {
  id: ID
  email: string
  username: string
  displayTag?: string
  avatarKey?: string
  avatarUrl?: string
  isEmailVerified: boolean
  isBlocked: boolean
  createdAt: ISODateTime
  updatedAt: ISODateTime
  cachedAt: ISODateTime
}

export type LocalBook = {
  id: ID
  authorId: ID
  authorName?: string
  title: string
  description?: string
  coverKey?: string
  coverUrl?: string
  fileFormat: BookFormat
  fileSizeBytes: number
  status: BookStatus
  readingMode: ReadingMode
  isInSubscription: boolean
  subscriptionPayoutAmount?: DecimalString
  isForSale: boolean
  salePrice?: DecimalString
  publishedAt?: ISODateTime
  createdAt: ISODateTime
  updatedAt: ISODateTime
  cachedAt: ISODateTime
}

export type LocalGenreTag = {
  id: ID
  name: string
  createdAt: ISODateTime
}

export type LocalBookGenreTag = {
  bookId: ID
  genreTagId: ID
}

export type LocalBookAccess = {
  id: ID
  userId: ID
  bookId: ID
  source: BookAccessSource
  hasAccess: boolean
  expiresAt?: ISODateTime
  updatedAt: ISODateTime
}

export type LocalBookState = {
  id: ID
  userId: ID
  bookId: ID
  status: ReadingStatus
  progressPercent: number
  updatedAt: ISODateTime
  syncedAt?: ISODateTime
  dirty: boolean
}

export type LocalReview = {
  id: ID
  bookId: ID
  userId: ID
  rating: number
  text?: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
  syncedAt?: ISODateTime
  deletedAt?: ISODateTime
  dirty: boolean
}

export type LocalReadlist = {
  id: ID
  userId: ID
  title: string
  description?: string
  isPublic: boolean
  createdAt: ISODateTime
  updatedAt: ISODateTime
  syncedAt?: ISODateTime
  deletedAt?: ISODateTime
  dirty: boolean
}

export type LocalReadlistItem = {
  id: ID
  readlistId: ID
  bookId: ID
  addedAt: ISODateTime
  syncedAt?: ISODateTime
  deletedAt?: ISODateTime
  dirty: boolean
}

export type LocalBookChapter = {
  id: ID
  bookId: ID
  order: number
  title?: string
  href?: string
  contentType: ChapterContentType
  content: string
  contentHash: string
  wordCount?: number
  createdAt?: ISODateTime
  updatedAt?: ISODateTime
  cachedAt: ISODateTime
}

export type LocalBookAsset = {
  id: ID
  bookId: ID
  chapterId?: ID
  kind: BookAssetKind
  mimeType: string
  key?: string
  url?: string
  blob?: Blob
  hash?: string
  sizeBytes?: number
  cachedAt: ISODateTime
}

export type LocalReadingProgress = {
  id: ID
  userId: ID
  bookId: ID
  chapterId: ID
  chapterOffset: number
  percentage: number
  cfi?: string
  updatedAt: ISODateTime
  syncedAt?: ISODateTime
  dirty: boolean
}

export type LocalReaderSettings = {
  id: ID
  userId: ID
  bookId?: ID
  theme: ReaderTheme
  fontFamily: string
  fontSize: number
  lineHeight: number
  pageMode: ReaderPageMode
  textAlign: TextAlignMode
  margin: number
  columnGap: number
  updatedAt: ISODateTime
  syncedAt?: ISODateTime
  dirty: boolean
}

export type LocalAnnotation = {
  id: ID
  userId: ID
  bookId: ID
  chapterId: ID
  type: AnnotationType
  range?: SerializedTextRange
  quote?: string
  color?: AnnotationColor
  text?: string
  note?: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
  syncedAt?: ISODateTime
  deletedAt?: ISODateTime
  dirty: boolean
}

export type LocalDownloadState = {
  bookId: ID
  status: DownloadStatus
  totalItems: number
  downloadedItems: number
  totalBytes?: number
  downloadedBytes?: number
  error?: string
  updatedAt: ISODateTime
  completedAt?: ISODateTime
}

export type LocalSearchIndex = {
  id: ID
  bookId: ID
  chapterId: ID
  title?: string
  text: string
  updatedAt: ISODateTime
}

type LocalOutboxItemBase = {
  id: ID
  entityId: ID
  userId?: ID
  bookId?: ID
  status: OutboxStatus
  attempts: number
  processingUntil?: ISODateTime
  idempotencyKey: string
  createdAt: ISODateTime
  updatedAt: ISODateTime
  bgSyncExpiresAt?: ISODateTime
  bgSyncQueuedAt?: ISODateTime
  nextRetryAt?: ISODateTime
  lastError?: string
}

export type LocalOutboxItem<TType extends OutboxType = OutboxType> =
  TType extends OutboxType
    ? LocalOutboxItemBase & {
        type: TType
        entityKind: OutboxEntityKindMap[TType]
        payload: OutboxEventPayloadMap[TType]
      }
    : never

export type OutboxEventEnvelope<TType extends OutboxType = OutboxType> =
  TType extends OutboxType
    ? {
        id: ID
        type: TType
        entityKind: OutboxEntityKindMap[TType]
        entityId: ID
        userId?: ID
        bookId?: ID
        payload: OutboxEventPayloadMap[TType]
        idempotencyKey: string
        occurredAt: ISODateTime
      }
    : never

export type LocalSyncState = {
  id: ID
  scope: SyncScope
  cursor?: string
  lastPulledAt?: ISODateTime
  lastPushedAt?: ISODateTime
  isSyncing: boolean
  lastError?: string
  updatedAt: ISODateTime
}

export type LocalSession = {
  key: 'current'
  userId: string
  updatedAt: number
}

export type LocalDatabaseTables = {
  userProfiles: Table<LocalUserProfile, ID>
  books: Table<LocalBook, ID>
  genreTags: Table<LocalGenreTag, ID>
  bookGenreTags: Table<LocalBookGenreTag, [ID, ID]>
  bookAccess: Table<LocalBookAccess, ID>
  bookStates: Table<LocalBookState, ID>
  reviews: Table<LocalReview, ID>
  readlists: Table<LocalReadlist, ID>
  readlistItems: Table<LocalReadlistItem, ID>
  bookChapters: Table<LocalBookChapter, ID>
  bookAssets: Table<LocalBookAsset, ID>
  readingProgress: Table<LocalReadingProgress, ID>
  readerSettings: Table<LocalReaderSettings, ID>
  annotations: Table<LocalAnnotation, ID>
  downloadStates: Table<LocalDownloadState, ID>
  searchIndex: Table<LocalSearchIndex, ID>
  outbox: Table<LocalOutboxItem, ID>
  syncState: Table<LocalSyncState, ID>
}

export const LOCAL_DB_STORES = {
  userProfiles: 'id, email, username, updatedAt, cachedAt',
  books:
    'id, authorId, title, status, fileFormat, readingMode, publishedAt, updatedAt, cachedAt',
  genreTags: 'id, name, createdAt',
  bookGenreTags: '[bookId+genreTagId], bookId, genreTagId',
  bookAccess:
    'id, userId, bookId, [userId+bookId], source, hasAccess, updatedAt',
  bookStates: 'id, userId, bookId, [userId+bookId], status, updatedAt, dirty',
  reviews:
    'id, bookId, userId, [bookId+userId], rating, updatedAt, deletedAt, dirty',
  readlists: 'id, userId, isPublic, updatedAt, deletedAt, dirty',
  readlistItems:
    'id, readlistId, bookId, [readlistId+bookId], addedAt, deletedAt, dirty',
  bookChapters: 'id, bookId, [bookId+order], contentHash, cachedAt',
  bookAssets: 'id, bookId, chapterId, kind, hash, cachedAt',
  readingProgress:
    'id, userId, bookId, [userId+bookId], chapterId, updatedAt, dirty',
  readerSettings: 'id, userId, bookId, [userId+bookId], updatedAt, dirty',
  annotations:
    'id, userId, bookId, chapterId, type, updatedAt, deletedAt, dirty',
  downloadStates: 'bookId, status, updatedAt, completedAt',
  searchIndex: 'id, bookId, chapterId, [bookId+chapterId], updatedAt',
  outbox:
    'id, status, type, entityKind, entityId, bookId, createdAt, updatedAt, nextRetryAt, [type+entityId]',
  syncState: 'id, scope, updatedAt',
  session: 'key, userId, updatedAt',
} as const
