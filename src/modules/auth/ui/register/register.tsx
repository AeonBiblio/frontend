import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Input } from '@shared/ui/input/input'
import { Spinner } from '@shared/ui/spinner/spinner'

import styles from './register.module.scss'
import { Link } from '@tanstack/react-router'

const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, 'Введите почту')
      .email('Введите корректный адрес почты'),
    password: z
      .string()
      .min(1, 'Введите пароль')
      .min(8, 'Пароль должен содержать минимум 8 символов')
      .max(128, 'Пароль не должен превышать 128 символов'),
    passwordConfirmation: z.string().min(1, 'Повторите пароль'),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: 'Пароли не совпадают',
    path: ['passwordConfirmation'],
  })

export type RegisterFormValues = z.infer<typeof registerSchema>

type RegisterProps = {
  onSubmit?: (values: RegisterFormValues) => Promise<void> | void
}

export function Register({ onSubmit }: RegisterProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      passwordConfirmation: '',
    },
  })

  const submitForm = handleSubmit(async (values) => {
    try {
      await onSubmit?.(values)
    } catch {
      setError('root', {
        message: 'Не удалось зарегистрироваться. Попробуйте ещё раз.',
      })
    }
  })

  return (
    <div className={styles.page}>
      <section className={styles.register} aria-labelledby="register-title">
        <h1 id="register-title" className={styles.title}>
          Регистрация
        </h1>

        <form className={styles.form} onSubmit={submitForm} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="register-email">
              Почта
            </label>
            <Input
              {...register('email')}
              id="register-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Почта"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? 'register-email-error' : undefined
              }
              className={styles.input}
            />
            {errors.email && (
              <p
                id="register-email-error"
                className={styles.error}
                role="alert"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="register-password">
              Пароль
            </label>
            <Input
              {...register('password')}
              id="register-password"
              type="password"
              autoComplete="new-password"
              placeholder="Пароль"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? 'register-password-error' : undefined
              }
              className={styles.input}
            />
            {errors.password && (
              <p
                id="register-password-error"
                className={styles.error}
                role="alert"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label
              className={styles.label}
              htmlFor="register-password-confirmation"
            >
              Повторите пароль
            </label>
            <Input
              {...register('passwordConfirmation')}
              id="register-password-confirmation"
              type="password"
              autoComplete="new-password"
              placeholder="Повторите пароль"
              aria-invalid={Boolean(errors.passwordConfirmation)}
              aria-describedby={
                errors.passwordConfirmation
                  ? 'register-password-confirmation-error'
                  : undefined
              }
              className={styles.input}
            />
            {errors.passwordConfirmation && (
              <p
                id="register-password-confirmation-error"
                className={styles.error}
                role="alert"
              >
                {errors.passwordConfirmation.message}
              </p>
            )}
          </div>

          <div className={styles.links}>
            <Link className={styles.loginLink} to="/login">
              Уже есть аккаунт?
            </Link>
          </div>

          {errors.root && (
            <p className={styles.submitError} role="alert">
              {errors.root.message}
            </p>
          )}

          <button
            className={styles.submit}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Spinner label="Регистрация" />
            ) : (
              'Зарегистрироваться'
            )}
          </button>
        </form>
      </section>
    </div>
  )
}
