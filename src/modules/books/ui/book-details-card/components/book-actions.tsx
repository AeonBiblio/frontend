import { BookPlus, Flag } from 'lucide-react'

import styles from '../book-details-card.module.scss'

type BookActionsProps = {
  buyLabel: string
  onAddToLibrary?: () => void
  onBuy?: () => void
  onComplain?: () => void
  onRead?: () => void
  subscriptionLabel: string
}

export function BookActions({
  buyLabel,
  onAddToLibrary,
  onBuy,
  onComplain,
  onRead,
  subscriptionLabel,
}: BookActionsProps) {
  return (
    <div className={styles.detailsActions}>
      <div className={styles.detailsActionButtons}>
        <button
          className={styles.detailsReadButton}
          type="button"
          onClick={onRead}
        >
          {subscriptionLabel}
        </button>
        <button
          className={styles.detailsBuyButton}
          type="button"
          onClick={onBuy}
        >
          {buyLabel}
        </button>
      </div>
      <div className={styles.detailsIconButtons}>
        <button
          className={styles.detailsIconButton}
          type="button"
          aria-label="Добавить в библиотеку"
          onClick={onAddToLibrary}
        >
          <BookPlus size={30} strokeWidth={1.6} />
        </button>
        <button
          className={styles.detailsIconButton}
          type="button"
          aria-label="Пожаловаться"
          onClick={onComplain}
        >
          <Flag size={26} strokeWidth={1.6} />
        </button>
      </div>
    </div>
  )
}
