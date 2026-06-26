import { createLazyFileRoute } from '@tanstack/react-router'

import { ProfilePage } from '@pages/profile'

export const Route = createLazyFileRoute('/profile')({
  component: ProfilePage,
})
