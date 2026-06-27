import { useMemo, useState } from 'react'

import { useAddBookToReadlistMutation } from '@modules/library/api'
import { useBooksQuery } from '@modules/books/api'
import { defaultBookFilters } from '@modules/books/model'
import { Button } from '@shared/ui/button/button'
import { Input } from '@shared/ui/input/input'

import styles from './add-to-collection-modal.module.scss'

type AddToCollectionModalProps = {
  readlistId: string
  onClose: () => void
}

export function AddToCollectionModal({
  readlistId,
  onClose,
}: AddToCollectionModalProps) {
  const [query, setQuery] = useState('')
  const booksQuery = useBooksQuery({
    ...defaultBookFilters,
    q: query,
    limit: 20,
  })
  const addMutation = useAddBookToReadlistMutation(readlistId)

  const books = useMemo(() => booksQuery.data ?? [], [booksQuery.data])

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-collection-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle} id="add-to-collection-title">
            Добавить в коллекцию
          </h2>
          <Button type="button" variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>

        <Input
          placeholder="Поиск книги"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <ul className={styles.modalList}>
          {books.map((book) => (
            <li className={styles.modalItem} key={book.id}>
              <span>{book.title}</span>
              <Button
                disabled={addMutation.isPending}
                type="button"
                onClick={async () => {
                  await addMutation.mutateAsync({ book_id: book.id })
                  onClose()
                }}
              >
                Добавить
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
