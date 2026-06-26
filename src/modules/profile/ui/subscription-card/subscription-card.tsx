import CheckWithCircleIcon from '@shared/assets/icons/check-with-circle.svg?react'
import { SurfaceCard } from '@shared/ui/surface-card'

import styles from './subscription-card.module.scss'

type SubscriptionCardProps = {
  color?: string
  onSubscribeClick?: () => void
  status?: 'active' | 'inactive'
}

export function SubscriptionCard({
  color = '#fff7eb',
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
            <p className={styles.cardPayment}>
              <span className={styles.cardPrice}>250 ₽</span> спишется 2 июля
            </p>

            <div className={styles.cardActions}>
              <button className={styles.cardPayButton} type="button">
                Оплатить сейчас
              </button>
              <button className={styles.cardCancelButton} type="button">
                Отменить подписку
              </button>
            </div>
          </>
        ) : (
          <button
            className={styles.cardSubscribeButton}
            type="button"
            onClick={onSubscribeClick}
          >
            Оформить подписку
          </button>
        )}
      </div>
    </SurfaceCard>
  )
}
