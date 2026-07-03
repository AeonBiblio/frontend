import type { AxiosInstance } from 'axios'

import { db } from '@shared/lib/db'
import {
  PDF_CHUNK_SIZE,
  getPdfOpfsPath,
  hasLocalPdf,
  removeLocalPdf,
  writePdfToOpfs,
} from '@shared/lib/opfs'

import { fetchBookContentRange } from './reader-queries'

export type DownloadPdfToOpfsOptions = {
  chunkSize?: number
  signal?: AbortSignal
  onProgress?: (progress: {
    downloadedBytes: number
    fileSizeBytes: number
  }) => void
}

function now() {
  return new Date().toISOString()
}

function nowMs() {
  return Date.now()
}

export async function isPdfAvailableOffline(bookId: string) {
  const [metadata, fileExists] = await Promise.all([
    db.pdfBooks.get(bookId),
    hasLocalPdf(bookId),
  ])

  return Boolean(metadata?.isFullyDownloaded && fileExists)
}

export async function removePdfFromOpfs(bookId: string) {
  await removeLocalPdf(bookId).catch(() => undefined)

  await db.transaction('rw', db.pdfBooks, db.downloadStates, async () => {
    await db.pdfBooks.delete(bookId)
    await db.downloadStates.put({
      bookId,
      status: 'removed',
      totalItems: 1,
      downloadedItems: 0,
      updatedAt: now(),
    })
  })
}

export async function downloadPdfToOpfs(
  client: AxiosInstance,
  bookId: string,
  fileSizeBytes: number,
  options: DownloadPdfToOpfsOptions = {},
) {
  const chunkSize = options.chunkSize ?? PDF_CHUNK_SIZE
  const opfsPath = getPdfOpfsPath(bookId)

  if (fileSizeBytes <= 0) {
    throw new Error('PDF file size must be greater than zero')
  }

  await db.transaction('rw', db.pdfBooks, db.downloadStates, async () => {
    await db.pdfBooks.put({
      bookId,
      fileSizeBytes,
      downloadedBytes: 0,
      isFullyDownloaded: false,
      opfsPath,
      updatedAt: nowMs(),
    })
    await db.downloadStates.put({
      bookId,
      status: 'downloading',
      totalItems: 1,
      downloadedItems: 0,
      totalBytes: fileSizeBytes,
      downloadedBytes: 0,
      updatedAt: now(),
    })
  })

  try {
    await writePdfToOpfs(bookId, fileSizeBytes, async (writable) => {
      let offset = 0

      while (offset < fileSizeBytes) {
        if (options.signal?.aborted) {
          throw new DOMException('PDF download aborted', 'AbortError')
        }

        const size = Math.min(chunkSize, fileSizeBytes - offset)
        const chunk = await fetchBookContentRange(
          client,
          bookId,
          offset,
          size,
          options.signal,
        )

        await writable.write({
          type: 'write',
          position: chunk.start,
          data: chunk.bytes,
        })

        offset = chunk.end + 1

        await db.transaction('rw', db.pdfBooks, db.downloadStates, async () => {
          await db.pdfBooks.update(bookId, {
            downloadedBytes: offset,
            isFullyDownloaded: false,
            updatedAt: nowMs(),
          })
          await db.downloadStates.update(bookId, {
            downloadedBytes: offset,
            updatedAt: now(),
          })
        })

        options.onProgress?.({
          downloadedBytes: offset,
          fileSizeBytes,
        })
      }
    })

    await db.transaction('rw', db.pdfBooks, db.downloadStates, async () => {
      await db.pdfBooks.update(bookId, {
        downloadedBytes: fileSizeBytes,
        isFullyDownloaded: true,
        updatedAt: nowMs(),
      })
      await db.downloadStates.update(bookId, {
        status: 'downloaded',
        downloadedItems: 1,
        downloadedBytes: fileSizeBytes,
        updatedAt: now(),
        completedAt: now(),
      })
    })

    return {
      bookId,
      fileSizeBytes,
      opfsPath,
    }
  } catch (error) {
    await db.transaction('rw', db.pdfBooks, db.downloadStates, async () => {
      await db.pdfBooks.update(bookId, {
        isFullyDownloaded: false,
        updatedAt: nowMs(),
      })
      await db.downloadStates.update(bookId, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        updatedAt: now(),
      })
    })

    throw error
  }
}
