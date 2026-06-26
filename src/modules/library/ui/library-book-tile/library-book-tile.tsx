import clsx from 'clsx'
import { Link } from '@tanstack/react-router'

import { defaultBookFilters } from '@modules/books/model'
import { getCoverSrc } from '@shared/lib/get-cover-src'

import styles from './library-book-tile.module.scss'

type LibraryBookTileProps = {
  className?: string
  coverKey?: string | null
  rating?: number | null
  title: string
}

export function LibraryBookTile({
  className,
  coverKey,
  rating,
  title,
}: LibraryBookTileProps) {
  return (
    <article className={clsx(styles.tile, className)}>
      <img
        alt={title}
        className={styles.tileCover}
        src={getCoverSrc(coverKey)}
      />
      <div className={styles.tileFooter}>
        {typeof rating === 'number' ? (
          <span className={styles.tileRating}>{rating}</span>
        ) : null}
        <Link className={styles.tileRead} search={defaultBookFilters} to="/">
          Читать
        </Link>
      </div>
    </article>
  )
}
