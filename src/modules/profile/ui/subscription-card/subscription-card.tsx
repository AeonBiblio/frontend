import CheckWithCircleIcon from '@shared/assets/icons/check-with-circle.svg?react'
import { SurfaceCard } from '@shared/ui/surface-card'

import styles from './subscription-card.module.scss'

type SubscriptionCardProps = {
  color?: string
  disabled?: boolean
  nextPaymentLabel?: string
  onCancelClick?: () => void
  onPayNowClick?: () => void
  onSubscribeClick?: () => void
  status?: 'active' | 'inactive'
}

export function SubscriptionCard({
  color = '#fff7eb',
  disabled = false,
  nextPaymentLabel = '250 ₽ спишется 2 июля',
  onCancelClick,
  onPayNowClick,
  onSubscribeClick,
  status = 'active',
}: SubscriptionCardProps) {
  const isActive = status === 'active'

  return (
    <SurfaceCard className={styles.card} color={color}>
      <div className={styles.cardContent} data-status={status}>
        <div className={styles.cardTitleRow}>
          <h2 className={styles.cardTitle}>
            {isActive ? 'Подписка оформлена' : 'Подписка  не оформлена'}
          </h2>
          {isActive && (
            <CheckWithCircleIcon
              className={styles.cardCheck}
              aria-hidden="true"
            />
          )}
        </div>

        {isActive ? (
          <>
            <p className={styles.cardPayment}>{nextPaymentLabel}</p>

            <div className={styles.cardActions}>
              <button
                className={styles.cardPayButton}
                type="button"
                disabled={disabled}
                onClick={onPayNowClick}
              >
                Оплатить сейчас
              </button>
              <button
                className={styles.cardCancelButton}
                type="button"
                disabled={disabled}
                onClick={onCancelClick}
              >
                Отменить подписку
              </button>
            </div>
          </>
        ) : (
          <button
            className={styles.cardSubscribeButton}
            type="button"
            disabled={disabled}
            onClick={onSubscribeClick}
          >
            Оформить подписку
          </button>
        )}
      </div>
    </SurfaceCard>
  )
}
