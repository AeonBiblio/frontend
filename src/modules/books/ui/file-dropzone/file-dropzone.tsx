import clsx from 'clsx'
import { ImageIcon, UploadIcon, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'

import styles from './file-dropzone.module.scss'

import type { ChangeEvent, DragEvent } from 'react'

type FileDropzoneProps = {
  accept: string
  className?: string
  existingFileLabel?: string | null
  formatsLabel: string
  icon?: 'book' | 'cover'
  label: string
  onFileChange: (file: File | null) => void
  selectedFile?: File | null
}

export function FileDropzone({
  accept,
  className,
  existingFileLabel,
  formatsLabel,
  icon = 'book',
  label,
  onFileChange,
  selectedFile,
}: FileDropzoneProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = (file: File | null) => {
    onFileChange(file)
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    handleFile(file)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)

    const file = event.dataTransfer.files.item(0)
    handleFile(file)
  }

  const chipLabel = selectedFile?.name ?? existingFileLabel

  return (
    <div className={clsx(styles.container, className)}>
      <div
        className={clsx(
          styles.containerDropzone,
          isDragging && styles.containerDropzoneActive,
        )}
        onDragEnter={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setIsDragging(false)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
        role="button"
        tabIndex={0}
        aria-labelledby={inputId}
      >
        <span className={styles.containerLabel} id={inputId}>
          {label}
        </span>
        <span className={styles.containerFormats}>{formatsLabel}</span>
        {icon === 'cover' ? (
          <ImageIcon
            aria-hidden="true"
            className={styles.containerIcon}
            size={28}
          />
        ) : (
          <UploadIcon
            aria-hidden="true"
            className={styles.containerIcon}
            size={28}
          />
        )}
      </div>

      <input
        ref={inputRef}
        accept={accept}
        className={styles.containerInput}
        type="file"
        onChange={handleInputChange}
      />

      {chipLabel ? (
        <div className={styles.containerChip}>
          <span className={styles.containerChipLabel}>{chipLabel}</span>
          {selectedFile ? (
            <button
              aria-label={`Удалить файл ${chipLabel}`}
              className={styles.containerChipRemove}
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                handleFile(null)

                if (inputRef.current) {
                  inputRef.current.value = ''
                }
              }}
            >
              <X aria-hidden="true" size={14} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
