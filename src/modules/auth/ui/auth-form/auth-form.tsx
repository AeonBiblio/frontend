import { Link } from '@tanstack/react-router'
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'

import { Input } from '@shared/ui/input/input'
import { Spinner } from '@shared/ui/spinner/spinner'

import styles from './auth-form.module.scss'

type AuthFormField<TValues extends FieldValues> = {
  name: Path<TValues>
  label: string
  type: 'email' | 'password'
  autoComplete: 'email' | 'current-password' | 'new-password'
  inputMode?: 'email'
}

type AuthFormAction = {
  label: string
  to?: '/login' | '/register'
  muted?: boolean
}

type AuthFormProps<TValues extends FieldValues> = {
  id: string
  title: string
  form: UseFormReturn<TValues>
  fields: Array<AuthFormField<TValues>>
  actions: Array<AuthFormAction>
  submitLabel: string
  submittingLabel: string
  submitErrorMessage: string
  onSubmit?: (values: TValues) => Promise<void> | void
}

export function AuthForm<TValues extends FieldValues>({
  id,
  title,
  form,
  fields,
  actions,
  submitLabel,
  submittingLabel,
  submitErrorMessage,
  onSubmit,
}: AuthFormProps<TValues>) {
  const {
    register,
    handleSubmit,
    setError,
    getFieldState,
    formState: { errors, isSubmitting },
  } = form

  const submitForm = handleSubmit(async (values) => {
    try {
      await onSubmit?.(values)
    } catch {
      setError('root', { message: submitErrorMessage })
    }
  })

  return (
    <div className={styles.page}>
      <section className={styles.auth} aria-labelledby={`${id}-title`}>
        <h1 id={`${id}-title`} className={styles.title}>
          {title}
        </h1>

        <form className={styles.form} onSubmit={submitForm} noValidate>
          {fields.map((field) => {
            const fieldId = `${id}-${field.name}`
            const error = getFieldState(field.name).error

            return (
              <div className={styles.field} key={field.name}>
                <label className={styles.label} htmlFor={fieldId}>
                  {field.label}
                </label>
                <Input
                  {...register(field.name)}
                  id={fieldId}
                  type={field.type}
                  inputMode={field.inputMode}
                  autoComplete={field.autoComplete}
                  placeholder={field.label}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${fieldId}-error` : undefined}
                  className={styles.input}
                />
                {error?.message && (
                  <p
                    id={`${fieldId}-error`}
                    className={styles.error}
                    role="alert"
                  >
                    {String(error.message)}
                  </p>
                )}
              </div>
            )
          })}

          <div className={styles.links}>
            {actions.map((action) =>
              action.to ? (
                <Link
                  className={action.muted ? styles.mutedLink : styles.link}
                  key={action.label}
                  to={action.to}
                >
                  {action.label}
                </Link>
              ) : (
                <span
                  className={action.muted ? styles.mutedLink : styles.link}
                  key={action.label}
                >
                  {action.label}
                </span>
              ),
            )}
          </div>

          {errors.root?.message && (
            <p className={styles.submitError} role="alert">
              {String(errors.root.message)}
            </p>
          )}

          <button
            className={styles.submit}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Spinner label={submittingLabel} /> : submitLabel}
          </button>
        </form>
      </section>
    </div>
  )
}
