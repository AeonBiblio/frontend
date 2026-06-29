import styles from '../book-page.module.scss'

import type { BookFormat } from '@shared/api/core'

type BookDownloadSectionProps = {
  disabled?: boolean
  format: BookFormat | null
  onDownload: (format: BookFormat) => void
}

function formatBookFormat(format: BookFormat | null | undefined) {
  return format ? format.toUpperCase() : 'неизвестном формате'
}

export function BookDownloadSection({
  disabled = false,
  format,
  onDownload,
}: BookDownloadSectionProps) {
  return (
    <section className={styles.download}>
      <div className={styles.downloadText}>
        <h2 className={styles.sectionTitle}>Скачать книгу</h2>
      </div>
      {format ? (
        <button
          className={styles.downloadButton}
          type="button"
          disabled={disabled}
          onClick={() => onDownload(format)}
        >
          {disabled ? 'Скачиваем...' : `Скачать ${formatBookFormat(format)}`}
        </button>
      ) : (
        <p className={styles.downloadUnavailable}>
          Файл книги пока не загружен.
        </p>
      )}
    </section>
  )
}
