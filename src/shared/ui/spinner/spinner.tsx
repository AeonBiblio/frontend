import clsx from 'clsx'

import styles from './spinner.module.scss'

type SpinnerProps = {
  className?: string
  label?: string
}

export function Spinner({ className, label = 'Загрузка' }: SpinnerProps) {
  return (
    <span className={clsx(styles.spinner, className)} role="status">
      <span className={styles.circle} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </span>
  )
}
