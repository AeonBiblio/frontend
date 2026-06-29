import styles from '../book-details-card.module.scss'

type BookCoverProps = {
  coverSrc: string
  paysAuthorFromSubscription: boolean
  title: string
}

export function BookCover({
  coverSrc,
  paysAuthorFromSubscription,
  title,
}: BookCoverProps) {
  const tooltip = paysAuthorFromSubscription
    ? 'Автор получает выплату при чтении по подписке'
    : 'Автор не получает выплату из подписки за эту книгу'

  return (
    <div className={styles.detailsCoverWrap}>
      <img className={styles.detailsCover} src={coverSrc} alt={title} />
      <div
        className={styles.detailsBookmarkWrap}
        role="img"
        tabIndex={0}
        aria-label={tooltip}
      >
        <span
          className={styles.detailsBookmark}
          data-pays={paysAuthorFromSubscription || undefined}
        />
        <span className={styles.detailsBookmarkTooltip}>{tooltip}</span>
      </div>
    </div>
  )
}
