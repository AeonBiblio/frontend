import clsx from 'clsx'

import styles from './surface-card.module.scss'

import type { CSSProperties, ReactNode } from 'react'

type SurfaceCardProps = {
  children: ReactNode
  className?: string
  color?: string
}

export function SurfaceCard({
  children,
  className,
  color = 'var(--color-cards)',
}: SurfaceCardProps) {
  return (
    <section
      className={clsx(styles.card, className)}
      style={{ '--surface-card-color': color } as CSSProperties}
    >
      {children}
    </section>
  )
}
