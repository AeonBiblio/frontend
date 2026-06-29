import clsx from 'clsx'

import styles from '../book-details-card.module.scss'

type BookRatingProps = {
  rating: number
  ratingsCount: number
  reviewsCount: number
  selectedScore?: number | null
  scoreDisabled?: boolean
  onScoreSelect?: (score: number) => void
}

const scores = Array.from({ length: 10 }, (_, index) => index + 1)

export function BookRating({
  rating,
  ratingsCount,
  reviewsCount,
  selectedScore,
  scoreDisabled = false,
  onScoreSelect,
}: BookRatingProps) {
  return (
    <aside className={styles.detailsRating}>
      <strong className={styles.detailsRatingValue}>{rating.toFixed(1)}</strong>
      <p className={styles.detailsRatingText}>{ratingsCount} оценка</p>
      <p className={styles.detailsRatingText}>{reviewsCount} рецензий</p>
      <p className={styles.detailsRatingTitle}>Оценить книгу</p>
      <div className={styles.detailsRatingScale}>
        {scores.map((score) => (
          <button
            className={clsx(
              styles.detailsRatingScore,
              selectedScore === score && styles.detailsRatingScoreActive,
            )}
            type="button"
            disabled={scoreDisabled}
            key={score}
            onClick={() => onScoreSelect?.(score)}
          >
            {score}
          </button>
        ))}
      </div>
    </aside>
  )
}
