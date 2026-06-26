import clsx from 'clsx'

import styles from './genre-tag-picker.module.scss'

type GenreTagOption = {
  id: string
  label: string
}

type GenreTagPickerProps = {
  className?: string
  isLoading?: boolean
  options: GenreTagOption[]
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
}

export function GenreTagPicker({
  className,
  isLoading = false,
  options,
  selectedIds,
  onChange,
}: GenreTagPickerProps) {
  const toggleTag = (tagId: string) => {
    if (selectedIds.includes(tagId)) {
      onChange(selectedIds.filter((id) => id !== tagId))
      return
    }

    onChange([...selectedIds, tagId])
  }

  if (isLoading) {
    return <p className={styles.containerState}>Жанры загружаются...</p>
  }

  if (options.length === 0) {
    return <p className={styles.containerState}>Жанры не найдены</p>
  }

  return (
    <div className={clsx(styles.container, className)} aria-label="Жанры">
      {options.map((option) => (
        <button
          key={option.id}
          aria-pressed={selectedIds.includes(option.id)}
          className={styles.containerTag}
          type="button"
          onClick={() => toggleTag(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
