import type { ReadingStatus } from '@shared/api/core'

export const SYSTEM_COLLECTION_IDS = {
  all: 'system:all',
  reading: 'system:reading',
  finished: 'system:finished',
} as const

export type SystemCollectionId =
  (typeof SYSTEM_COLLECTION_IDS)[keyof typeof SYSTEM_COLLECTION_IDS]

export type SystemCollection = {
  id: SystemCollectionId
  title: string
  filterStatus: ReadingStatus | null
}

export const SYSTEM_COLLECTIONS: SystemCollection[] = [
  { id: SYSTEM_COLLECTION_IDS.all, title: 'Все', filterStatus: null },
  {
    id: SYSTEM_COLLECTION_IDS.reading,
    title: 'Открытые',
    filterStatus: 'reading',
  },
  {
    id: SYSTEM_COLLECTION_IDS.finished,
    title: 'Законченные',
    filterStatus: 'finished',
  },
]
