import { useState } from 'react'

import { SurfaceCard } from '@shared/ui/surface-card'

import styles from './author-coupons-card.module.scss'

type AuthorCouponsCardProps = {
  color?: string
  issueCoupons?: number
  promoCode?: string
}

export function AuthorCouponsCard({
  color = '#fff',
  issueCoupons = 14,
  promoCode = 'ABC-1-DEF-23-GHIJ',
}: AuthorCouponsCardProps) {
  const [expanded, setExpanded] = useState(true)
  const [promoCodeVisible, setPromoCodeVisible] = useState(false)

  return (
    <SurfaceCard className={styles.card} color={color}>
      <div className={styles.cardRow}>
        <span>Доступно купонов для выдачи читателям</span>
        <strong>{issueCoupons}</strong>
      </div>

      <button
        className={styles.cardRow}
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <span>Последний выданный промокод</span>
        <span
          className={styles.cardChevron}
          data-expanded={expanded || undefined}
          aria-hidden="true"
        />
      </button>

      {expanded && (
        <div className={styles.cardPromo}>
          <span className={styles.cardPromoCode}>
            {promoCodeVisible ? promoCode : '***-*-***-**-****'}
          </span>
          <button
            className={styles.cardPromoButton}
            type="button"
            onClick={() => setPromoCodeVisible((value) => !value)}
          >
            {promoCodeVisible ? 'Скрыть' : 'Показать'}
          </button>
        </div>
      )}
    </SurfaceCard>
  )
}
