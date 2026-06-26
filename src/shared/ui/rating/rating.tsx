import clsx from 'clsx'

import styles from './rating.module.scss'

import type { CSSProperties } from 'react'

type RatingProps = {
  value: number
  className?: string
  color?: string
}

export function Rating({ value, className, color }: RatingProps) {
  return (
    <span
      className={clsx(styles.rating, className)}
      style={{ '--rating-color': color } as CSSProperties}
    >
      {value.toFixed(1)}
    </span>
  )
}
