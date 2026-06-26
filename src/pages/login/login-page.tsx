import { AuthLayout, Login } from '@modules/auth/ui'
import { useLoginMutation } from '@shared/api/auth'

export function LoginPage() {
  const loginMutation = useLoginMutation()

  return (
    <AuthLayout>
      <Login
        onSubmit={async (values) => {
          await loginMutation.mutateAsync(values)
        }}
      />
    </AuthLayout>
  )
}
