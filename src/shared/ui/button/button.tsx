import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

import styles from './button.module.scss'

type ButtonVariant = 'primary' | 'dangerOutline' | 'outline' | 'success'
type ButtonSize = 'md' | 'sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

export const Button = ({
  className,
  children,
  disabled,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  ...props
}: ButtonProps) => {
  return (
    <button
      type={type}
      disabled={disabled}
      className={clsx(
        styles.container,
        variant === 'primary' && styles.containerPrimary,
        variant === 'dangerOutline' && styles.containerDangerOutline,
        variant === 'outline' && styles.containerOutline,
        variant === 'success' && styles.containerSuccess,
        size === 'md' && styles.containerMd,
        size === 'sm' && styles.containerSm,
        fullWidth && styles.containerFullWidth,
        disabled && styles.containerDisabled,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
