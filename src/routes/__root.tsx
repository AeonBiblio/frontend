import { createRootRouteWithContext } from '@tanstack/react-router'

import { RootDocument, rootHead } from '@app/ui/root-document'

import type { RouterContext } from '@app/providers/tanstack-query/router-context'

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => rootHead,
  shellComponent: RootDocument,
})
