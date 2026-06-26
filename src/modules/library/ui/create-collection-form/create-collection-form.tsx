import { useState } from 'react'

import { Button } from '@shared/ui/button/button'
import { Input } from '@shared/ui/input/input'

import styles from './create-collection-form.module.scss'

type CreateCollectionFormProps = {
  isSubmitting?: boolean
  onCreate: (title: string) => void | Promise<void>
}

export function CreateCollectionForm({
  isSubmitting = false,
  onCreate,
}: CreateCollectionFormProps) {
  const [title, setTitle] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = async () => {
    const trimmed = title.trim()

    if (!trimmed) {
      return
    }

    await onCreate(trimmed)
    setTitle('')
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <Button
        className={styles.formTrigger}
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
      >
        Создать новую коллекцию +
      </Button>
    )
  }

  return (
    <div className={styles.form}>
      <Input
        autoFocus
        placeholder="Введите название новой коллекции"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <div className={styles.formActions}>
        <Button
          disabled={!title.trim() || isSubmitting}
          type="button"
          onClick={handleSubmit}
        >
          Создать
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsOpen(false)
            setTitle('')
          }}
        >
          Отмена
        </Button>
      </div>
    </div>
  )
}
