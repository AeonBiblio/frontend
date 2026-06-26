import styles from '../book-details-card.module.scss'

type BookMetaProps = {
  author: string
  genre: string
}

export function BookMeta({ author, genre }: BookMetaProps) {
  return (
    <dl className={styles.detailsMeta}>
      <div className={styles.detailsMetaItem}>
        <dt className={styles.detailsMetaLabel}>Автор</dt>
        <dd className={styles.detailsMetaValue}>{author}</dd>
      </div>
      <div className={styles.detailsMetaItem}>
        <dt className={styles.detailsMetaLabel}>Жанр</dt>
        <dd className={styles.detailsMetaValue}>{genre}</dd>
      </div>
    </dl>
  )
}
