import styles from '../profile-page.module.scss'

type PayoutModalProps = {
  amount: string
  disabled?: boolean
  onAmountChange: (amount: string) => void
  onClose: () => void
  onSubmit: () => void
}

export function PayoutModal({
  amount,
  disabled = false,
  onAmountChange,
  onClose,
  onSubmit,
}: PayoutModalProps) {
  return (
    <div className={styles.payoutOverlay} role="presentation">
      <form
        className={styles.payoutModal}
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <h2 className={styles.payoutTitle}>Вывод средств</h2>
        <label className={styles.payoutField}>
          <span>Сумма</span>
          <input
            className={styles.payoutInput}
            value={amount}
            inputMode="decimal"
            placeholder="100.00"
            onChange={(event) => onAmountChange(event.target.value)}
          />
        </label>
        <div className={styles.payoutActions}>
          <button
            className={styles.payoutSecondary}
            type="button"
            onClick={onClose}
          >
            Отмена
          </button>
          <button
            className={styles.payoutPrimary}
            type="submit"
            disabled={disabled || !amount.trim()}
          >
            Вывести
          </button>
        </div>
      </form>
    </div>
  )
}
