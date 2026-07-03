export { bookKeys, genreTagKeys } from './common'

export {
  bookQueryOptions,
  bookRatingQueryOptions,
  bookRecommendationsQueryOptions,
  booksQueryOptions,
  useBookAccessQuery,
  useBookQuery,
  useBookRatingQuery,
  useBooksQuery,
  useBookRecommendationsQuery,
} from './book-queries'

export {
  bookGenreTagsQueryOptions,
  genreTagsQueryOptions,
  useBookGenreTagsQuery,
  useGenreTagsQuery,
} from './genre-queries'

export {
  fetchBookContentChunk,
  fetchBookContentRange,
  readerAssetQueryOptions,
  readerChapterQueryOptions,
  readerManifestQueryOptions,
  readerTocQueryOptions,
  useReaderAssetQuery,
  useReaderChapterQuery,
  useReaderManifestQuery,
  useReaderTocQuery,
} from './reader-queries'

export type { BookContentChunk, BookContentRange } from './reader-queries'

export {
  downloadPdfToOpfs,
  isPdfAvailableOffline,
  removePdfFromOpfs,
} from './pdf-download'

export type { DownloadPdfToOpfsOptions } from './pdf-download'

export {
  getBookDownloadState,
  getReaderOfflineAvailability,
  useBookDownloadState,
  useReaderOfflineAvailability,
} from './offline-status'

export type { ReaderOfflineAvailability } from './offline-status'

export { downloadReaderBook, prefetchReaderChapters } from './reader-download'

export type {
  DownloadReaderBookOptions,
  PrefetchReaderChaptersOptions,
  ReaderDownloadProgress,
} from './reader-download'

export {
  useDeleteBookMutation,
  useDownloadReaderBookMutation,
  useDownloadPdfToOpfsMutation,
  useDownloadBookFileMutation,
  usePrefetchReaderChaptersMutation,
  usePurchaseBookMutation,
  usePutBookRatingMutation,
  useRecordBookReadMutation,
} from './mutations'
