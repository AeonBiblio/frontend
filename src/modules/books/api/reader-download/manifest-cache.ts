import type { AxiosInstance } from 'axios'

import type { ReaderManifest } from '@shared/api/core'
import { readerManifestSchema } from '@shared/api/core'
import {
  db,
  readerManifestToLocalBookAssets,
  readerManifestToLocalBookChapters,
  readerManifestToLocalReaderManifest,
  readerManifestToLocalReaderTocItems,
} from '@shared/lib/db'

async function cleanupStaleReaderVersion(bookId: string, version: number) {
  const [chapters, assets, tocItems] = await Promise.all([
    db.bookChapters
      .where('bookId')
      .equals(bookId)
      .filter((item) => item.manifestVersion !== version)
      .primaryKeys(),
    db.bookAssets
      .where('bookId')
      .equals(bookId)
      .filter((item) => item.manifestVersion !== version)
      .primaryKeys(),
    db.readerTocItems
      .where('bookId')
      .equals(bookId)
      .filter((item) => item.manifestVersion !== version)
      .primaryKeys(),
  ])

  await db.transaction(
    'rw',
    db.bookChapters,
    db.bookAssets,
    db.readerTocItems,
    async () => {
      await db.bookChapters.bulkDelete(chapters)
      await db.bookAssets.bulkDelete(assets)
      await db.readerTocItems.bulkDelete(tocItems)
    },
  )
}

async function saveReaderManifest(manifest: ReaderManifest) {
  const localManifest = readerManifestToLocalReaderManifest(manifest)
  const chapters = readerManifestToLocalBookChapters(manifest)
  const assets = readerManifestToLocalBookAssets(manifest)
  const tocItems = readerManifestToLocalReaderTocItems(manifest)

  await db.transaction(
    'rw',
    db.readerManifests,
    db.bookChapters,
    db.bookAssets,
    db.readerTocItems,
    async () => {
      await db.readerManifests.put(localManifest)
      await db.bookChapters.bulkPut(chapters)
      await db.bookAssets.bulkPut(assets)
      await db.readerTocItems.bulkPut(tocItems)
    },
  )

  await cleanupStaleReaderVersion(manifest.book_id, manifest.version)
}

async function fetchAndCacheReaderManifest(
  client: AxiosInstance,
  bookId: string,
  signal?: AbortSignal,
) {
  const response = await client.get<ReaderManifest>(
    `/books/${bookId}/reader-manifest`,
    { signal },
  )
  const manifest = readerManifestSchema.parse(response.data)

  await saveReaderManifest(manifest)

  return manifest
}

async function getCachedReaderManifest(bookId: string) {
  const manifest = await db.readerManifests.get(bookId)

  if (!manifest) {
    return null
  }

  const [chapters, assets] = await Promise.all([
    db.bookChapters
      .where('[bookId+manifestVersion]')
      .equals([bookId, manifest.version])
      .sortBy('index'),
    db.bookAssets
      .where('[bookId+manifestVersion]')
      .equals([bookId, manifest.version])
      .toArray(),
  ])

  return {
    book_id: manifest.bookId,
    format: manifest.format,
    version: manifest.version,
    title: manifest.title,
    processing_status: manifest.processingStatus,
    chapters: chapters.map((chapter) => ({
      id: chapter.id,
      index: chapter.index,
      title: chapter.title,
      size_bytes: chapter.sizeBytes ?? 0,
      href: chapter.href ?? `/books/${bookId}/chapters/${chapter.id}`,
      asset_ids: chapter.assetIds,
    })),
    assets: assets.map((asset) => ({
      id: asset.id,
      href: asset.href ?? `/books/${bookId}/assets/${asset.id}`,
    })),
  } satisfies ReaderManifest
}

export async function getReaderManifest(
  client: AxiosInstance,
  bookId: string,
  signal?: AbortSignal,
) {
  try {
    return await fetchAndCacheReaderManifest(client, bookId, signal)
  } catch (error) {
    const cached = await getCachedReaderManifest(bookId)

    if (cached) {
      return cached
    }

    throw error
  }
}
