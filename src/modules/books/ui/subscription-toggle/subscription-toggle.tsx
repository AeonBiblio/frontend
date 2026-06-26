import clsx from 'clsx'

import styles from './subscription-toggle.module.scss'

type SubscriptionToggleProps = {
  className?: string
  value: boolean
  onChange: (value: boolean) => void
}

export function SubscriptionToggle({
  className,
  value,
  onChange,
}: SubscriptionToggleProps) {
  return (
    <div
      className={clsx(styles.container, className)}
      role="group"
      aria-label="Подписка"
    >
      <button
        aria-pressed={value}
        className={clsx(
          styles.containerSegment,
          value && styles.containerSegmentActive,
        )}
        type="button"
        onClick={() => onChange(true)}
      >
        В подписке
      </button>
      <button
        aria-pressed={!value}
        className={clsx(
          styles.containerSegment,
          !value && styles.containerSegmentActive,
        )}
        type="button"
        onClick={() => onChange(false)}
      >
        Не в подписке
      </button>
    </div>
  )
}
