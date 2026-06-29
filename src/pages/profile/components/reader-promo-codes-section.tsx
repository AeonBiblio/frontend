import styles from '../profile-page.module.scss'

import type { LocalPromoCode } from '@shared/lib/db'

type ReaderPromoCodesSectionProps = {
  isLoading: boolean
  promoCodes: LocalPromoCode[]
  onSelect: (code: string) => void
}

function formatDate(value?: string | null) {
  if (!value) {
    return '—'
  }

  return new Date(value).toLocaleDateString('ru-RU')
}

export function ReaderPromoCodesSection({
  isLoading,
  promoCodes,
  onSelect,
}: ReaderPromoCodesSectionProps) {
  return (
    <section className={styles.readerPromos}>
      <div className={styles.readerPromosHeader}>
        <h2 className={styles.readerPromosTitle}>Мои промокоды</h2>
        <span className={styles.readerPromosMeta}>
          {isLoading ? 'Загрузка' : 'Доступные'}
        </span>
      </div>
      {promoCodes.length > 0 ? (
        <div className={styles.readerPromoList}>
          {promoCodes.map((promoCode) => (
            <button
              className={styles.readerPromo}
              key={promoCode.id}
              type="button"
              onClick={() => onSelect(promoCode.code)}
            >
              <strong>{promoCode.code}</strong>
              <span>
                {promoCode.discountPercent
                  ? `Скидка ${promoCode.discountPercent}%`
                  : 'Промокод'}
                {promoCode.expiresAt
                  ? ` · до ${formatDate(promoCode.expiresAt)}`
                  : ''}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className={styles.readerPromosEmpty}>
          Доступных промокодов пока нет
        </p>
      )}
    </section>
  )
}
