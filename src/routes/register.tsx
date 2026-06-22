import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { Register } from '@modules/auth/ui'
import { useRegisterMutation } from '@shared/api/auth'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
  head: () => ({
    meta: [{ title: 'Регистрация' }],
  }),
})

function RegisterPage() {
  const navigate = useNavigate()
  const registerMutation = useRegisterMutation()

  return (
    <Register
      onSubmit={async ({ email, password }) => {
        await registerMutation.mutateAsync({
          email,
          password,
          username: email.slice(0, email.indexOf('@')),
        })
        await navigate({ to: '/login' })
      }}
    />
  )
}
