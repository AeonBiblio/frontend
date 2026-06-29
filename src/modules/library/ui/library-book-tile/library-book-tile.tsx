import clsx from 'clsx'
import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'

import { getCoverSrc } from '@shared/lib/get-cover-src'

import styles from './library-book-tile.module.scss'

type LibraryBookTileProps = {
  className?: string
  coverKey?: string | null
  disabledRemove?: boolean
  onRemove?: () => void
  rating?: number | null
  title: string
}

export function LibraryBookTile({
  className,
  coverKey,
  disabledRemove = false,
  onRemove,
  rating,
  title,
}: LibraryBookTileProps) {
  return (
    <article className={clsx(styles.tile, className)}>
      <div className={styles.tileCoverWrap}>
        <img
          alt={title}
          className={styles.tileCover}
          src={getCoverSrc(coverKey)}
        />
        {onRemove ? (
          <button
            aria-label={`Убрать книгу ${title} из коллекции`}
            className={styles.tileRemove}
            disabled={disabledRemove}
            title="Убрать из коллекции"
            type="button"
            onClick={onRemove}
          >
            <X aria-hidden size={14} />
          </button>
        ) : null}
      </div>
      <div className={styles.tileFooter}>
        {typeof rating === 'number' ? (
          <span className={styles.tileRating}>{rating}</span>
        ) : null}
        <Link className={styles.tileRead} to="/">
          Читать
        </Link>
      </div>
    </article>
  )
}
