import { createLazyFileRoute } from '@tanstack/react-router'

import { Login } from '@modules/auth/ui'
import { useLoginMutation } from '@shared/api/auth'

export const Route = createLazyFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const loginMutation = useLoginMutation()

  return (
    <Login
      onSubmit={async (values) => {
        await loginMutation.mutateAsync(values)
      }}
    />
  )
}
