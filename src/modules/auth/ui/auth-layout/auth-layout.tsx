import authImage from '@shared/assets/images/Rectangle 14.webp'

import styles from './auth-layout.module.scss'

import type { ReactNode } from 'react'

type AuthLayoutProps = {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className={styles.layout}>
      <div className={styles.layoutForm}>{children}</div>
      <div className={styles.layoutImageWrap} aria-hidden="true">
        <img className={styles.layoutImage} src={authImage} alt="" />
      </div>
    </div>
  )
}
