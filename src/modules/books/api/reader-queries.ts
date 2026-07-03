import { queryOptions, useQuery } from '@tanstack/react-query'
import type { AxiosInstance } from 'axios'

import type { ReaderChapter, ReaderManifest } from '@shared/api/core'
import { readerChapterSchema, readerManifestSchema } from '@shared/api/core'
import {
  db,
  readerChapterToLocalBookChapter,
  readerManifestToLocalBookAssets,
  readerManifestToLocalBookChapters,
  readerManifestToLocalReaderManifest,
  readerManifestToLocalReaderTocItems,
} from '@shared/lib/db'
import type {
  LocalBookAsset,
  LocalBookChapter,
  LocalReaderManifest,
  LocalReaderTocItem,
} from '@shared/lib/db'
import { useApiClient } from '@shared/api/runtimeConfig/provider/provider'

import { bookKeys } from './common'

export type BookContentRange = {
  bytes: ArrayBuffer
  start: number
  end: number
  total: number
  contentType?: string
}

function parseContentRange(value: string) {
  const match = value.match(/^bytes (\d+)-(\d+)\/(\d+)$/)

  if (!match) {
    throw new Error(`Invalid Content-Range: ${value}`)
  }

  return {
    start: Number(match[1]),
    end: Number(match[2]),
    total: Number(match[3]),
  }
}

function getHeaderValue(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function localManifestToReaderManifest(
  manifest: LocalReaderManifest | undefined,
  chapters: LocalBookChapter[],
  assets: LocalBookAsset[],
): ReaderManifest | null {
  if (!manifest) {
    return null
  }

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
      href: chapter.href ?? `/books/${manifest.bookId}/chapters/${chapter.id}`,
      asset_ids: chapter.assetIds,
    })),
    assets: assets.map((asset) => ({
      id: asset.id,
      href: asset.href ?? `/books/${manifest.bookId}/assets/${asset.id}`,
    })),
  }
}

function localChapterToReaderChapter(
  chapter: LocalBookChapter | undefined,
): ReaderChapter | null {
  if (!chapter || !chapter.contentType) {
    return null
  }

  return {
    id: chapter.id,
    book_id: chapter.bookId,
    index: chapter.index,
    title: chapter.title,
    content_type: chapter.contentType,
    html: chapter.contentType === 'html' ? chapter.content : undefined,
    text: chapter.contentType === 'text' ? chapter.content : undefined,
    json:
      chapter.contentType === 'json' && chapter.content
        ? JSON.parse(chapter.content)
        : undefined,
    asset_ids: chapter.assetIds,
  }
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
}

async function readLocalReaderManifest(bookId: string) {
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

  return localManifestToReaderManifest(manifest, chapters, assets)
}

export function readerManifestQueryOptions(
  bookId: string,
  client: AxiosInstance,
) {
  return queryOptions({
    queryKey: bookKeys.readerManifest(bookId),
    queryFn: async () => {
      try {
        const response = await client.get<ReaderManifest>(
          `/books/${bookId}/reader-manifest`,
        )
        const manifest = readerManifestSchema.parse(response.data)

        await saveReaderManifest(manifest)

        return manifest
      } catch (error) {
        const localManifest = await readLocalReaderManifest(bookId)

        if (localManifest) {
          return localManifest
        }

        throw error
      }
    },
    staleTime: 60 * 1000,
  })
}

export function useReaderManifestQuery(
  bookId: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const client = useApiClient()

  return useQuery({
    ...readerManifestQueryOptions(bookId, client),
    enabled: enabled && Boolean(bookId),
  })
}

export function readerTocQueryOptions(
  bookId: string,
  manifestVersion: number | undefined,
) {
  return queryOptions({
    queryKey: bookKeys.readerToc(bookId, manifestVersion),
    queryFn: async (): Promise<LocalReaderTocItem[]> => {
      if (manifestVersion === undefined) {
        return []
      }

      return db.readerTocItems
        .where('[bookId+manifestVersion]')
        .equals([bookId, manifestVersion])
        .sortBy('order')
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useReaderTocQuery(
  bookId: string,
  manifestVersion: number | undefined,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    ...readerTocQueryOptions(bookId, manifestVersion),
    enabled: enabled && Boolean(bookId) && manifestVersion !== undefined,
  })
}

export function readerChapterQueryOptions(
  bookId: string,
  chapterId: string,
  client: AxiosInstance,
) {
  return queryOptions({
    queryKey: bookKeys.readerChapter(bookId, chapterId),
    queryFn: async () => {
      try {
        const response = await client.get<ReaderChapter>(
          `/books/${bookId}/chapters/${chapterId}`,
        )
        const chapter = readerChapterSchema.parse(response.data)

        await db.bookChapters.put(readerChapterToLocalBookChapter(chapter))

        return chapter
      } catch (error) {
        const localChapter = localChapterToReaderChapter(
          await db.bookChapters.get(chapterId),
        )

        if (localChapter) {
          return localChapter
        }

        throw error
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useReaderChapterQuery(
  bookId: string,
  chapterId: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const client = useApiClient()

  return useQuery({
    ...readerChapterQueryOptions(bookId, chapterId, client),
    enabled: enabled && Boolean(bookId) && Boolean(chapterId),
  })
}

export async function fetchBookContentRange(
  client: AxiosInstance,
  bookId: string,
  start: number,
  size: number,
  signal?: AbortSignal,
): Promise<BookContentRange> {
  const end = start + size - 1
  const response = await client.get<ArrayBuffer>(`/books/${bookId}/content`, {
    headers: {
      Range: `bytes=${start}-${end}`,
    },
    responseType: 'arraybuffer',
    signal,
  })

  if (response.status !== 206) {
    throw new Error(`Range request failed: ${response.status}`)
  }

  const range = parseContentRange(
    getHeaderValue(response.headers['content-range']) ?? '',
  )

  return {
    bytes: response.data,
    ...range,
    contentType: getHeaderValue(response.headers['content-type']),
  }
}
