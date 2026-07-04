import type { AxiosInstance } from 'axios'

import {
  fetchAndCacheReaderAsset,
  fetchAndCacheReaderChapter,
  getUniqueAssetIds,
} from './content-cache'
import { updateDownloadState } from './download-state'
import { getReaderManifest } from './manifest-cache'
import { throwIfAborted } from './utils'
import type { PrefetchReaderChaptersOptions } from './types'

export async function prefetchReaderChapters(
  client: AxiosInstance,
  bookId: string,
  options: PrefetchReaderChaptersOptions,
) {
  const windowSize = options.windowSize ?? 3
  const includeAssets = options.includeAssets ?? false
  const manifest = await getReaderManifest(client, bookId, options.signal)
  const chapters = manifest.chapters
    .filter(
      (chapter) =>
        chapter.index >= options.chapterIndex &&
        chapter.index < options.chapterIndex + windowSize,
    )
    .sort((a, b) => a.index - b.index)
  const chapterIds = new Set(chapters.map((chapter) => chapter.id))
  const assetIds = includeAssets ? getUniqueAssetIds(manifest, chapterIds) : []
  const totalItems = chapters.length + assetIds.length
  let downloadedItems = 0

  await updateDownloadState(bookId, {
    status: 'downloading',
    totalItems,
    downloadedItems,
  })

  try {
    for (const chapter of chapters) {
      throwIfAborted(options.signal)
      await fetchAndCacheReaderChapter(
        client,
        bookId,
        chapter.id,
        manifest.version,
        options.signal,
      )
      downloadedItems += 1
      options.onProgress?.({ downloadedItems, totalItems })
      await updateDownloadState(bookId, {
        status: 'downloading',
        totalItems,
        downloadedItems,
      })
    }

    for (const assetId of assetIds) {
      throwIfAborted(options.signal)
      await fetchAndCacheReaderAsset(
        client,
        bookId,
        assetId,
        manifest.version,
        options.signal,
      )
      downloadedItems += 1
      options.onProgress?.({ downloadedItems, totalItems })
      await updateDownloadState(bookId, {
        status: 'downloading',
        totalItems,
        downloadedItems,
      })
    }

    await updateDownloadState(bookId, {
      status: 'idle',
      totalItems,
      downloadedItems,
    })

    return { bookId, downloadedItems, totalItems }
  } catch (error) {
    await updateDownloadState(bookId, {
      status: 'failed',
      totalItems,
      downloadedItems,
      error: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}
