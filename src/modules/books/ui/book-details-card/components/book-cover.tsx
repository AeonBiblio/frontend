import styles from '../book-details-card.module.scss'

type BookCoverProps = {
  coverSrc: string
  title: string
}

export function BookCover({ coverSrc, title }: BookCoverProps) {
  return (
    <div className={styles.detailsCoverWrap}>
      <img className={styles.detailsCover} src={coverSrc} alt={title} />
      <div className={styles.detailsBookmarks} aria-hidden="true">
        <span className={styles.detailsBookmarkRed} />
        <span className={styles.detailsBookmarkLight} />
        <span className={styles.detailsBookmarkGray} />
      </div>
    </div>
  )
}
