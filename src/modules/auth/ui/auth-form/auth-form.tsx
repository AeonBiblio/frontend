import { Link } from '@tanstack/react-router'
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'

import { Input } from '@shared/ui/input/input'
import { Spinner } from '@shared/ui/spinner/spinner'

import styles from './auth-form.module.scss'

type AuthFormInputField<TValues extends FieldValues> = {
  name: Path<TValues>
  label: string
  type: 'email' | 'password'
  autoComplete: 'email' | 'current-password' | 'new-password'
  inputMode?: 'email'
}

type AuthFormRoleField<TValues extends FieldValues> = {
  name: Path<TValues>
  label: string
  type: 'role'
  options: Array<{
    label: string
    value: string
  }>
}

type AuthFormField<TValues extends FieldValues> =
  | AuthFormInputField<TValues>
  | AuthFormRoleField<TValues>

type AuthFormAction = {
  label: string
  to?: '/login' | '/register' | '.'
  muted?: boolean
  color?: string
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
    <section className={styles.container} aria-labelledby={`${id}-title`}>
      <h1 id={`${id}-title`} className={styles.containerTitle}>
        {title}
      </h1>

      <form className={styles.containerForm} onSubmit={submitForm} noValidate>
        {fields.map((field) => {
          const fieldId = `${id}-${field.name}`
          const error = getFieldState(field.name).error

          return (
            <div className={styles.containerField} key={field.name}>
              {field.type === 'role' ? (
                <fieldset
                  className={styles.containerRole}
                  aria-describedby={error ? `${fieldId}-error` : undefined}
                >
                  <legend className={styles.containerRoleLabel}>
                    {field.label}
                  </legend>
                  <div className={styles.containerRoleOptions}>
                    {field.options.map((option) => (
                      <label
                        className={styles.containerRoleOption}
                        key={option.value}
                      >
                        <input
                          {...register(field.name)}
                          type="radio"
                          value={option.value}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : (
                <>
                  <label className={styles.containerLabel} htmlFor={fieldId}>
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
                    className={styles.containerInput}
                  />
                </>
              )}
              {error?.message && (
                <p
                  id={`${fieldId}-error`}
                  className={styles.containerError}
                  role="alert"
                >
                  {String(error.message)}
                </p>
              )}
            </div>
          )
        })}

        <div className={styles.containerLinks}>
          {actions.map((action) => (
            <Link
              className={
                action.muted ? styles.containerLinkMuted : styles.containerLink
              }
              key={action.label}
              to={action.to ?? '.'}
              style={{ color: action.color }}
            >
              {action.label}
            </Link>
          ))}
        </div>

        {errors.root?.message && (
          <p className={styles.containerError} role="alert">
            {String(errors.root.message)}
          </p>
        )}

        <button
          className={styles.containerSubmit}
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? <Spinner label={submittingLabel} /> : submitLabel}
        </button>
      </form>
    </section>
  )
}
