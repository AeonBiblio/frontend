export type ReaderDownloadProgress = {
  downloadedItems: number
  totalItems: number
}

export type PrefetchReaderChaptersOptions = {
  chapterIndex: number
  windowSize?: number
  includeAssets?: boolean
  signal?: AbortSignal
  onProgress?: (progress: ReaderDownloadProgress) => void
}

export type DownloadReaderBookOptions = {
  signal?: AbortSignal
  onProgress?: (progress: ReaderDownloadProgress) => void
}

export type ReaderDownloadState = {
  status: 'idle' | 'downloading' | 'downloaded' | 'failed'
  totalItems: number
  downloadedItems: number
  error?: string
  completedAt?: string
}
