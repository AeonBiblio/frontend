import clsx from 'clsx'
import { BookPlus, Flag } from 'lucide-react'

import styles from '../book-details-card.module.scss'

type BookActionsProps = {
  buyLabel: string
  complainActive?: boolean
  complainDisabled?: boolean
  onAddToLibrary?: () => void
  onBuy?: () => void
  onComplain?: () => void
  onRead?: () => void
  showBuyButton?: boolean
  subscriptionLabel: string
}

export function BookActions({
  buyLabel,
  complainActive = false,
  complainDisabled = false,
  onAddToLibrary,
  onBuy,
  onComplain,
  onRead,
  showBuyButton = true,
  subscriptionLabel,
}: BookActionsProps) {
  return (
    <div className={styles.detailsActions}>
      <div className={styles.detailsActionButtons}>
        <button
          className={styles.detailsReadButton}
          type="button"
          disabled
          onClick={onRead}
        >
          {subscriptionLabel}
        </button>
        {showBuyButton ? (
          <button
            className={styles.detailsBuyButton}
            type="button"
            onClick={onBuy}
          >
            {buyLabel}
          </button>
        ) : null}
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
          className={clsx(
            styles.detailsIconButton,
            complainActive && styles.detailsIconButtonActive,
          )}
          type="button"
          aria-label="Пожаловаться"
          aria-pressed={complainActive}
          disabled={complainDisabled || !onComplain}
          onClick={onComplain}
        >
          <Flag size={26} strokeWidth={1.6} />
        </button>
      </div>
    </div>
  )
}
