import { useMemo, useState } from 'react'

import {
  useBookStatusesQuery,
  useDeleteReadlistMutation,
  useEnrichedBooksQuery,
  useReadlistBooksQuery,
  useReadlistsQuery,
  useUpdateReadlistMutation,
} from '@modules/library/api'
import type { ReadingStatus, ReadlistOut } from '@shared/api/core'

import { SYSTEM_COLLECTIONS } from '../../model/system-collections'
import { CollectionAccordion } from '../collection-accordion'
import { CreateCollectionForm } from '../create-collection-form'
import { AddToCollectionModal } from '../add-to-collection-modal'

import styles from './collections-section.module.scss'

type CollectionsSectionProps = {
  onCreateCollection: (title: string) => Promise<void>
  isCreating?: boolean
}

function ReadlistAccordion({
  readlist,
  onAddBooks,
}: {
  readlist: ReadlistOut
  onAddBooks: (readlistId: string) => void
}) {
  const booksQuery = useReadlistBooksQuery(readlist.id, { enabled: true })
  const bookIds = useMemo(
    () => (booksQuery.data ?? []).map((item) => item.book_id),
    [booksQuery.data],
  )
  const enrichedQuery = useEnrichedBooksQuery(bookIds)
  const updateMutation = useUpdateReadlistMutation(readlist.id)
  const deleteMutation = useDeleteReadlistMutation()

  return (
    <CollectionAccordion
      bookIds={bookIds}
      books={enrichedQuery.data ?? new Map()}
      canEdit
      isRenaming={updateMutation.isPending}
      title={readlist.title}
      onAddBooks={() => onAddBooks(readlist.id)}
      onDelete={() => {
        if (window.confirm('Удалить коллекцию?')) {
          deleteMutation.mutate(readlist.id)
        }
      }}
      onRename={async (title) => {
        await updateMutation.mutateAsync({ title })
      }}
    />
  )
}

function SystemCollectionAccordion({
  filterStatus,
  statuses,
  title,
}: {
  filterStatus: ReadingStatus | null
  statuses: Array<{ book_id: string; status: ReadingStatus }>
  title: string
}) {
  const bookIds = useMemo(() => {
    const filtered =
      filterStatus === null
        ? statuses
        : statuses.filter((item) => item.status === filterStatus)

    return filtered.map((item) => item.book_id)
  }, [filterStatus, statuses])

  const enrichedQuery = useEnrichedBooksQuery(bookIds)

  return (
    <CollectionAccordion
      bookIds={bookIds}
      books={enrichedQuery.data ?? new Map()}
      title={title}
    />
  )
}

export function CollectionsSection({
  isCreating = false,
  onCreateCollection,
}: CollectionsSectionProps) {
  const statusesQuery = useBookStatusesQuery()
  const readlistsQuery = useReadlistsQuery()
  const [addToReadlistId, setAddToReadlistId] = useState<string | null>(null)

  const statuses = statusesQuery.data ?? []
  const readlists = readlistsQuery.data ?? []

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Мои коллекции</h2>
        <CreateCollectionForm
          isSubmitting={isCreating}
          onCreate={onCreateCollection}
        />
      </div>

      <div className={styles.sectionList}>
        {SYSTEM_COLLECTIONS.map((collection) => (
          <SystemCollectionAccordion
            filterStatus={collection.filterStatus}
            key={collection.id}
            statuses={statuses}
            title={collection.title}
          />
        ))}

        {readlists.map((readlist) => (
          <ReadlistAccordion
            key={readlist.id}
            readlist={readlist}
            onAddBooks={setAddToReadlistId}
          />
        ))}
      </div>

      {addToReadlistId ? (
        <AddToCollectionModal
          readlistId={addToReadlistId}
          onClose={() => setAddToReadlistId(null)}
        />
      ) : null}
    </section>
  )
}
