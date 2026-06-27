import { useMemo, useState } from 'react'

import type { BookEditorFormData } from '@modules/books/api'
import { Button } from '@shared/ui/button/button'
import { Input } from '@shared/ui/input/input'

import { FileDropzone } from '../file-dropzone'
import { GenreTagPicker } from '../genre-tag-picker'
import { SubscriptionToggle } from '../subscription-toggle'

import styles from './book-editor-form.module.scss'

import type { FormEvent } from 'react'

export type BookEditorInitialValues = Partial<
  Omit<BookEditorFormData, 'bookFile' | 'coverFile'>
> & {
  existingBookFileLabel?: string | null
  existingCoverFileLabel?: string | null
}

type BookEditorFormProps = {
  errorMessage?: string | null
  genreTags: Array<{ id: string; label: string }>
  initialValues?: BookEditorInitialValues
  isGenreTagsLoading?: boolean
  isSubmitting?: boolean
  mode: 'publish' | 'edit'
  onSubmit: (data: BookEditorFormData) => void | Promise<void>
  pageTitle: string
  submitLabel: string
}

const defaultValues: Required<
  Pick<
    BookEditorFormData,
    'title' | 'description' | 'isInSubscription' | 'price' | 'genreTagIds'
  >
> = {
  title: '',
  description: '',
  isInSubscription: true,
  price: '',
  genreTagIds: [],
}

export function BookEditorForm({
  errorMessage,
  genreTags,
  initialValues,
  isGenreTagsLoading = false,
  isSubmitting = false,
  mode,
  onSubmit,
  pageTitle,
  submitLabel,
}: BookEditorFormProps) {
  const [title, setTitle] = useState(
    initialValues?.title ?? defaultValues.title,
  )
  const [description, setDescription] = useState(
    initialValues?.description ?? defaultValues.description,
  )
  const [isInSubscription, setIsInSubscription] = useState(
    initialValues?.isInSubscription ?? defaultValues.isInSubscription,
  )
  const [price, setPrice] = useState(
    initialValues?.price ?? defaultValues.price,
  )
  const [genreTagIds, setGenreTagIds] = useState(
    initialValues?.genreTagIds ?? defaultValues.genreTagIds,
  )
  const [bookFile, setBookFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    if (!title.trim()) {
      return false
    }

    if (genreTagIds.length === 0) {
      return false
    }

    if (mode === 'publish' && !bookFile) {
      return false
    }

    if (mode === 'edit' && !bookFile && !initialValues?.existingBookFileLabel) {
      return false
    }

    return true
  }, [
    bookFile,
    genreTagIds.length,
    initialValues?.existingBookFileLabel,
    mode,
    title,
  ])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setValidationError(null)

    if (!title.trim()) {
      setValidationError('Укажите название книги')
      return
    }

    if (genreTagIds.length === 0) {
      setValidationError('Выберите хотя бы один жанр')
      return
    }

    if (mode === 'publish' && !bookFile) {
      setValidationError('Загрузите файл книги')
      return
    }

    if (mode === 'edit' && !bookFile && !initialValues?.existingBookFileLabel) {
      setValidationError('Загрузите файл книги')
      return
    }

    await onSubmit({
      title,
      description,
      isInSubscription,
      price,
      genreTagIds,
      bookFile,
      coverFile,
    })
  }

  return (
    <section className={styles.container}>
      <h1 className={styles.containerTitle}>{pageTitle}</h1>
      <p className={styles.containerHint}>
        Перетащите сюда файлы или кликните для выбора
      </p>

      <form className={styles.containerForm} onSubmit={handleSubmit}>
        <div className={styles.containerUploads}>
          <FileDropzone
            accept=".epub,.fb2,.pdf"
            existingFileLabel={initialValues?.existingBookFileLabel}
            formatsLabel="Доступные форматы: epub, fb2, PDF"
            label="Книга"
            selectedFile={bookFile}
            onFileChange={setBookFile}
          />
          <FileDropzone
            accept=".png,.webp"
            existingFileLabel={initialValues?.existingCoverFileLabel}
            formatsLabel="Доступные форматы: png, webp"
            icon="cover"
            label="Обложка"
            selectedFile={coverFile}
            onFileChange={setCoverFile}
          />
        </div>

        <GenreTagPicker
          isLoading={isGenreTagsLoading}
          options={genreTags}
          selectedIds={genreTagIds}
          onChange={setGenreTagIds}
        />

        <label className={styles.containerField}>
          <span className={styles.containerFieldLabel}>Название</span>
          <Input
            placeholder="Название книги"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label className={styles.containerField}>
          <span className={styles.containerFieldLabel}>Описание</span>
          <textarea
            className={styles.containerTextarea}
            placeholder="Описание для вашей книги"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <div className={styles.containerPricing}>
          <label className={styles.containerPriceField}>
            <Input
              inputMode="decimal"
              placeholder="Цена руб."
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </label>
          <SubscriptionToggle
            value={isInSubscription}
            onChange={setIsInSubscription}
          />
        </div>

        {validationError ? (
          <p className={styles.containerError} role="alert">
            {validationError}
          </p>
        ) : null}

        {errorMessage ? (
          <p className={styles.containerError} role="alert">
            {errorMessage}
          </p>
        ) : null}

        <Button
          className={styles.containerSubmit}
          disabled={!canSubmit || isSubmitting}
          fullWidth
          type="submit"
        >
          {isSubmitting ? 'Сохранение...' : submitLabel}
        </Button>
      </form>
    </section>
  )
}
