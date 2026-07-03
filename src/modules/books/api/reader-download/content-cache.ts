import type { AxiosInstance } from 'axios'

import type { ReaderChapter, ReaderManifest } from '@shared/api/core'
import { readerChapterSchema } from '@shared/api/core'
import { db, readerChapterToLocalBookChapter } from '@shared/lib/db'

import { getHeaderValue, now } from './utils'

async function hasCachedChapter(chapterId: string) {
  const chapter = await db.bookChapters.get(chapterId)

  return Boolean(chapter?.contentType && chapter.content)
}

async function hasCachedAsset(assetId: string) {
  const asset = await db.bookAssets.get(assetId)

  return Boolean(asset?.blob)
}

export async function fetchAndCacheReaderChapter(
  client: AxiosInstance,
  bookId: string,
  chapterId: string,
  manifestVersion: number,
  signal?: AbortSignal,
) {
  if (await hasCachedChapter(chapterId)) {
    return
  }

  const response = await client.get<ReaderChapter>(
    `/books/${bookId}/chapters/${chapterId}`,
    { signal },
  )
  const chapter = readerChapterSchema.parse(response.data)

  await db.bookChapters.put({
    ...readerChapterToLocalBookChapter(chapter),
    manifestVersion,
  })
}

export async function fetchAndCacheReaderAsset(
  client: AxiosInstance,
  bookId: string,
  assetId: string,
  manifestVersion: number,
  signal?: AbortSignal,
) {
  if (await hasCachedAsset(assetId)) {
    return
  }

  const response = await client.get<Blob>(
    `/books/${bookId}/assets/${assetId}`,
    {
      responseType: 'blob',
      signal,
    },
  )
  const blob = response.data

  await db.bookAssets.put({
    id: assetId,
    bookId,
    manifestVersion,
    blob,
    mimeType: blob.type || getHeaderValue(response.headers['content-type']),
    cachedAt: now(),
  })
}

export function getUniqueAssetIds(
  manifest: ReaderManifest,
  chapterIds: Set<string>,
) {
  const ids = new Set<string>()

  manifest.chapters.forEach((chapter) => {
    if (!chapterIds.has(chapter.id)) {
      return
    }

    chapter.asset_ids.forEach((assetId) => ids.add(assetId))
  })

  return [...ids]
}
