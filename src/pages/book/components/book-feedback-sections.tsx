import clsx from 'clsx'

import { ReviewForm, ReviewList } from '@modules/reviews'
import styles from '../book-page.module.scss'

import type { ReviewFormSubmitPayload } from '@modules/reviews'

type BookFeedbackSectionsProps = {
  bookId: string
  canIssuePromo: boolean
  createReviewPending?: boolean
  userLabel: string | null
  onReviewSubmit: (payload: ReviewFormSubmitPayload) => void
}

export function BookFeedbackSections({
  bookId,
  canIssuePromo,
  createReviewPending = false,
  userLabel,
  onReviewSubmit,
}: BookFeedbackSectionsProps) {
  return (
    <div className={styles.sections}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Написать рецензию</h2>
        {userLabel ? (
          <ReviewForm
            userLabel={userLabel}
            disabled={createReviewPending}
            onSubmit={onReviewSubmit}
          />
        ) : (
          <p className={styles.authHint}>
            Войдите, чтобы поставить оценку и написать рецензию.
          </p>
        )}
      </section>

      <section className={clsx(styles.section, styles.reviews)}>
        <h2 className={styles.sectionTitle}>Отзывы</h2>
        <ReviewList
          bookId={bookId}
          canIssuePromo={canIssuePromo}
          height={620}
          pageSize={20}
        />
      </section>
    </div>
  )
}
