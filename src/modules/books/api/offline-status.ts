import { db, useLiveQuery } from '@shared/lib/db'

import { isPdfAvailableOffline } from './pdf-download'

import type { BookFormat } from '@shared/api/core'
import type { LocalDownloadState } from '@shared/lib/db'

export type ReaderOfflineAvailability = {
  downloadedAssets: number
  downloadedChapters: number
  isAvailableOffline: boolean
  isPartiallyAvailableOffline: boolean
  state: LocalDownloadState | null
  totalAssets: number
  totalChapters: number
}

const emptyAvailability = (
  state: LocalDownloadState | null,
): ReaderOfflineAvailability => ({
  downloadedAssets: 0,
  downloadedChapters: 0,
  isAvailableOffline: false,
  isPartiallyAvailableOffline: false,
  state,
  totalAssets: 0,
  totalChapters: 0,
})

async function getChapterBookAvailability(
  bookId: string,
  state: LocalDownloadState | null,
): Promise<ReaderOfflineAvailability> {
  const manifest = await db.readerManifests.get(bookId)

  if (!manifest) {
    return emptyAvailability(state)
  }

  const [chapters, assets] = await Promise.all([
    db.bookChapters
      .where('[bookId+manifestVersion]')
      .equals([bookId, manifest.version])
      .toArray(),
    db.bookAssets
      .where('[bookId+manifestVersion]')
      .equals([bookId, manifest.version])
      .toArray(),
  ])
  const downloadedChapters = chapters.filter(
    (chapter) => chapter.contentType && chapter.content,
  ).length
  const downloadedAssets = assets.filter((asset) => asset.blob).length
  const isAvailableOffline =
    manifest.chapterCount > 0 &&
    downloadedChapters >= manifest.chapterCount &&
    downloadedAssets >= manifest.assetCount
  const isPartiallyAvailableOffline =
    !isAvailableOffline && (downloadedChapters > 0 || downloadedAssets > 0)

  return {
    downloadedAssets,
    downloadedChapters,
    isAvailableOffline,
    isPartiallyAvailableOffline,
    state,
    totalAssets: manifest.assetCount,
    totalChapters: manifest.chapterCount,
  }
}

async function getPdfBookAvailability(
  bookId: string,
  state: LocalDownloadState | null,
): Promise<ReaderOfflineAvailability> {
  const isAvailableOffline = await isPdfAvailableOffline(bookId)
  const pdfBook = await db.pdfBooks.get(bookId)

  return {
    downloadedAssets: 0,
    downloadedChapters: pdfBook?.downloadedBytes ?? 0,
    isAvailableOffline,
    isPartiallyAvailableOffline:
      !isAvailableOffline && Boolean(pdfBook?.downloadedBytes),
    state,
    totalAssets: 0,
    totalChapters: pdfBook?.fileSizeBytes ?? 0,
  }
}

export async function getBookDownloadState(bookId: string) {
  return (await db.downloadStates.get(bookId)) ?? null
}

export async function getReaderOfflineAvailability(
  bookId: string,
  format: BookFormat | null | undefined,
) {
  const state = await getBookDownloadState(bookId)

  if (format === 'pdf') {
    return getPdfBookAvailability(bookId, state)
  }

  if (format === 'epub' || format === 'fb2') {
    return getChapterBookAvailability(bookId, state)
  }

  return emptyAvailability(state)
}

export function useBookDownloadState(bookId: string) {
  return useLiveQuery(
    () => getBookDownloadState(bookId),
    [bookId],
    null as LocalDownloadState | null,
  )
}

export function useReaderOfflineAvailability(
  bookId: string,
  format: BookFormat | null | undefined,
) {
  return useLiveQuery(
    () => getReaderOfflineAvailability(bookId, format),
    [bookId, format],
    emptyAvailability(null),
  )
}
