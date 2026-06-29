import { SurfaceCard } from '@shared/ui/surface-card'

import styles from './promo-code-input-card.module.scss'

type PromoCodeInputCardProps = {
  color?: string
  disabled?: boolean
  onChange: (value: string) => void
  onSubmit?: () => void
  value: string
}

export function PromoCodeInputCard({
  color = '#fff',
  disabled = false,
  onChange,
  onSubmit,
  value,
}: PromoCodeInputCardProps) {
  return (
    <SurfaceCard className={styles.card} color={color}>
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Промокод</h2>
          <p className={styles.cardText}>
            Введите код, чтобы применить его при оформлении подписки.
          </p>
        </div>

        <div className={styles.cardForm}>
          <input
            className={styles.cardInput}
            value={value}
            disabled={disabled}
            placeholder="Введите промокод"
            onChange={(event) => onChange(event.target.value)}
          />
          <button
            className={styles.cardButton}
            type="button"
            disabled={disabled || !value.trim()}
            onClick={onSubmit}
          >
            Применить
          </button>
        </div>
      </div>
    </SurfaceCard>
  )
}
