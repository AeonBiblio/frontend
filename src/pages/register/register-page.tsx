import { useNavigate } from '@tanstack/react-router'

import { AuthLayout, Register } from '@modules/auth/ui'
import { useRegisterMutation } from '@shared/api/auth'

export function RegisterPage() {
  const navigate = useNavigate()
  const registerMutation = useRegisterMutation()

  return (
    <AuthLayout>
      <Register
        onSubmit={async ({ email, password, role }) => {
          await registerMutation.mutateAsync({
            email,
            password,
            role,
            username: email.slice(0, email.indexOf('@')),
          })
          await navigate({ to: '/login' })
        }}
      />
    </AuthLayout>
  )
}
