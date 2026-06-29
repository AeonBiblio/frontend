import { SurfaceCard } from '@shared/ui/surface-card'

import styles from './balance-card.module.scss'

type BalanceCardProps = {
  actionLabel?: string
  amount?: string
  color?: string
  disabled?: boolean
  label?: string
  onAction?: () => void
}

export function BalanceCard({
  actionLabel = 'Вывести',
  amount = '18 123, 23',
  color = '#f5f6ff',
  disabled = false,
  label = 'БАЛАНС',
  onAction,
}: BalanceCardProps) {
  return (
    <SurfaceCard className={styles.card} color={color}>
      <div className={styles.cardBalance}>
        <span className={styles.cardLabel}>{label}</span>
        <span className={styles.cardAmount}>{amount}</span>
        <span className={styles.cardCurrency}>руб.</span>
      </div>

      <button
        className={styles.cardButton}
        type="button"
        disabled={disabled}
        onClick={onAction}
      >
        {actionLabel}
      </button>
    </SurfaceCard>
  )
}
