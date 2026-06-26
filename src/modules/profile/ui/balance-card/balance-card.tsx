import { SurfaceCard } from '@shared/ui/surface-card'

import styles from './balance-card.module.scss'

type BalanceCardProps = {
  amount?: string
  color?: string
}

export function BalanceCard({
  amount = '18 123, 23',
  color = '#f5f6ff',
}: BalanceCardProps) {
  return (
    <SurfaceCard className={styles.card} color={color}>
      <div className={styles.cardBalance}>
        <span className={styles.cardLabel}>БАЛАНС</span>
        <span className={styles.cardAmount}>{amount}</span>
        <span className={styles.cardCurrency}>руб.</span>
      </div>

      <button className={styles.cardButton} type="button">
        Вывести
      </button>
    </SurfaceCard>
  )
}
