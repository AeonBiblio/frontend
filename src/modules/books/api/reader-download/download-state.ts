import { db } from '@shared/lib/db'

import { now } from './utils'
import type { ReaderDownloadState } from './types'

export async function updateDownloadState(
  bookId: string,
  state: ReaderDownloadState,
) {
  await db.downloadStates.put({
    bookId,
    totalBytes: undefined,
    downloadedBytes: undefined,
    updatedAt: now(),
    ...state,
  })
}
