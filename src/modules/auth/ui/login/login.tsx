import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { emailSchema, passwordSchema } from '../auth-form/auth-form-schema'
import { AuthForm } from '../auth-form/auth-form'

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export type LoginFormValues = z.infer<typeof loginSchema>

type LoginProps = {
  onSubmit?: (values: LoginFormValues) => Promise<void> | void
}

export function Login({ onSubmit }: LoginProps) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  return (
    <AuthForm
      id="login"
      title="Рады видеть вас!"
      form={form}
      fields={[
        {
          name: 'email',
          label: 'Почта',
          type: 'email',
          inputMode: 'email',
          autoComplete: 'email',
        },
        {
          name: 'password',
          label: 'Пароль',
          type: 'password',
          autoComplete: 'current-password',
        },
      ]}
      actions={[
        { label: 'Забыли пароль?', muted: true },
        {
          label: 'Зарегистрироваться',
          to: '/register',
          color: 'var(--color-active)',
        },
      ]}
      submitLabel="Войти"
      submittingLabel="Вход"
      submitErrorMessage="Не удалось войти. Проверьте данные и попробуйте ещё раз."
      onSubmit={onSubmit}
    />
  )
}
