import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Input } from '@shared/ui/input/input'
import { Spinner } from '@shared/ui/spinner/spinner'

import styles from './login.module.scss'
import { Link } from '@tanstack/react-router'

const loginSchema = z.object({
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
})

export type LoginFormValues = z.infer<typeof loginSchema>

type LoginProps = {
  onSubmit?: (values: LoginFormValues) => Promise<void> | void
}

export function Login({ onSubmit }: LoginProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const submitForm = handleSubmit(async (values) => {
    try {
      await onSubmit?.(values)
    } catch {
      setError('root', {
        message: 'Не удалось войти. Проверьте данные и попробуйте ещё раз.',
      })
    }
  })

  return (
    <div className={styles.page}>
      <section className={styles.login} aria-labelledby="login-title">
        <h1 id="login-title" className={styles.title}>
          Рады видеть вас!
        </h1>

        <form className={styles.form} onSubmit={submitForm} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-email">
              Почта
            </label>
            <Input
              {...register('email')}
              id="login-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Почта"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              className={styles.input}
            />
            {errors.email && (
              <p id="login-email-error" className={styles.error} role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-password">
              Пароль
            </label>
            <Input
              {...register('password')}
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Пароль"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? 'login-password-error' : undefined
              }
              className={styles.input}
            />
            {errors.password && (
              <p
                id="login-password-error"
                className={styles.error}
                role="alert"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          <div className={styles.links}>
            <span className={styles.forgotLink}>Забыли пароль?</span>
            <Link className={styles.registerLink} to="/register">
              Зарегистрироваться
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
            {isSubmitting ? <Spinner label="Вход" /> : 'Войти'}
          </button>
        </form>
      </section>
    </div>
  )
}
