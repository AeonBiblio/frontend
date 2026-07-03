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
  fetchBookContentRange,
  readerChapterQueryOptions,
  readerManifestQueryOptions,
  readerTocQueryOptions,
  useReaderChapterQuery,
  useReaderManifestQuery,
  useReaderTocQuery,
} from './reader-queries'

export type { BookContentRange } from './reader-queries'

export { downloadPdfToOpfs, isPdfAvailableOffline } from './pdf-download'

export type { DownloadPdfToOpfsOptions } from './pdf-download'

export { prefetchReaderChapters } from './reader-download'

export type {
  PrefetchReaderChaptersOptions,
  ReaderDownloadProgress,
} from './reader-download'

export {
  useDeleteBookMutation,
  useDownloadBookFileMutation,
  usePrefetchReaderChaptersMutation,
  usePurchaseBookMutation,
  usePutBookRatingMutation,
  useRecordBookReadMutation,
} from './mutations'
