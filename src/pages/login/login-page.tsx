import { useNavigate } from '@tanstack/react-router'
import { Helmet } from 'react-helmet-async'

import { AuthLayout, Login } from '@modules/auth/ui'
import { useLoginMutation } from '@shared/api/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLoginMutation()

  return (
    <>
      <Helmet>
        <title>Вход</title>
        <meta
          name="description"
          content="Вход в аккаунт AeonBiblio для чтения, библиотеки и управления книгами."
        />
      </Helmet>
      <AuthLayout>
        <Login
          onSubmit={async (values) => {
            await loginMutation.mutateAsync(values)
            await navigate({ to: '/', replace: true })
          }}
        />
      </AuthLayout>
    </>
  )
}
