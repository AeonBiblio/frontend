import { createFileRoute } from '@tanstack/react-router'

import { IndexPage, indexSearchSchema } from '@pages/index'

export const Route = createFileRoute('/')({
  validateSearch: (search) => indexSearchSchema.parse(search),
  component: IndexPage,
})
