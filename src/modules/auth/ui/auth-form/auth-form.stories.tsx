import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { emailSchema, passwordSchema } from './auth-form-schema'
import { AuthForm } from './auth-form'

import type { Meta, StoryObj } from '@storybook/react-vite'

const schema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

type AuthFormStoryValues = z.infer<typeof schema>

function AuthFormStory() {
  const form = useForm<AuthFormStoryValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  return (
    <AuthForm
      id="storybook-auth-form"
      title="Форма авторизации"
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
        { label: 'Зарегистрироваться', to: '/register' },
      ]}
      submitLabel="Отправить"
      submittingLabel="Отправка"
      submitErrorMessage="Не удалось отправить форму."
      onSubmit={() => undefined}
    />
  )
}

const meta = {
  title: 'Modules/Auth/AuthForm',
  component: AuthFormStory,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof AuthFormStory>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {}
