import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef, ComponentType, SVGProps } from 'react'
import clsx from 'clsx'

import styles from './input.module.scss'

interface InputProps extends ComponentPropsWithoutRef<'input'> {
  className?: string
  inputClassName?: string
  leftIcon?: ComponentType<SVGProps<SVGSVGElement>>
  rightIcon?: ComponentType<SVGProps<SVGSVGElement>>
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      inputClassName,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      disabled,
      type = 'text',
      ...props
    },
    ref,
  ) => {
    return (
      <div
        className={clsx(
          styles.container,
          disabled && styles.containerDisabled,
          className,
        )}
      >
        {LeftIcon && (
          <span className={styles.containerIcon}>
            <LeftIcon aria-hidden="true" width="1em" height="1em" />
          </span>
        )}

        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={clsx(styles.containerInput, inputClassName)}
          {...props}
        />

        {RightIcon && (
          <span className={styles.containerIcon}>
            <RightIcon aria-hidden="true" width="1em" height="1em" />
          </span>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
