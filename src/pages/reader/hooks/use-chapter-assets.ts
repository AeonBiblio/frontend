import { useEffect, useState } from 'react'

import { db } from '@shared/lib/db'

import type { ReaderChapter, ReaderManifest } from '@shared/api/core'
import type { ResolvedChapterAsset } from '../lib/chapter-html'

export function useChapterAssets({
  bookId,
  chapter,
  manifest,
}: {
  bookId: string
  chapter: ReaderChapter
  manifest: ReaderManifest
}) {
  const [assets, setAssets] = useState<ResolvedChapterAsset[]>([])

  useEffect(() => {
    let disposed = false
    let objectUrls: string[] = []

    async function loadAssets() {
      const manifestAssets = new Map(
        manifest.assets.map((asset) => [asset.id, asset.href]),
      )
      const localAssets = await db.bookAssets
        .where('[bookId+manifestVersion]')
        .equals([bookId, manifest.version])
        .filter((asset) => chapter.asset_ids.includes(asset.id))
        .toArray()
      const resolved = localAssets
        .filter((asset) => asset.blob)
        .map((asset) => {
          const objectUrl = URL.createObjectURL(asset.blob as Blob)

          return {
            asset: {
              ...asset,
              href: asset.href ?? manifestAssets.get(asset.id),
            },
            objectUrl,
          }
        })

      objectUrls = resolved.map((asset) => asset.objectUrl)

      if (!disposed) {
        setAssets(resolved)
      } else {
        objectUrls.forEach((url) => URL.revokeObjectURL(url))
      }
    }

    void loadAssets()

    return () => {
      disposed = true
      objectUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [bookId, chapter.asset_ids, manifest.assets, manifest.version])

  return assets
}
