import { useNavigate } from '@tanstack/react-router'
import { Helmet } from 'react-helmet-async'

import { AuthLayout, Register } from '@modules/auth/ui'
import { useRegisterMutation } from '@shared/api/auth'

export function RegisterPage() {
  const navigate = useNavigate()
  const registerMutation = useRegisterMutation()

  return (
    <>
      <Helmet>
        <title>Регистрация</title>
        <meta
          name="description"
          content="Регистрация в AeonBiblio для читателей и авторов."
        />
      </Helmet>
      <AuthLayout>
        <Register
          onSubmit={async ({ email, password, role }) => {
            await registerMutation.mutateAsync({
              email,
              password,
              role,
              username: email.slice(0, email.indexOf('@')),
            })
            await navigate({ to: '/', replace: true })
          }}
        />
      </AuthLayout>
    </>
  )
}
