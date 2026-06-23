import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { emailSchema, passwordSchema } from '../auth-form/auth-form-schema'
import { AuthForm } from '../auth-form/auth-form'

const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
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
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      passwordConfirmation: '',
    },
  })

  return (
    <AuthForm
      id="register"
      title="Регистрация"
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
          autoComplete: 'new-password',
        },
        {
          name: 'passwordConfirmation',
          label: 'Повторите пароль',
          type: 'password',
          autoComplete: 'new-password',
        },
      ]}
      actions={[{ label: 'Уже есть аккаунт?', to: '/login' }]}
      submitLabel="Зарегистрироваться"
      submittingLabel="Регистрация"
      submitErrorMessage="Не удалось зарегистрироваться. Попробуйте ещё раз."
      onSubmit={onSubmit}
    />
  )
}
