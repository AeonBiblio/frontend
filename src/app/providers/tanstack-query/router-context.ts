import { QueryClient } from '@tanstack/react-query'

import { isNetworkError } from '@shared/api/client/api-client'

export interface RouterContext {
  queryClient: QueryClient
}

export function createRouterContext(): RouterContext {
  return {
    queryClient: new QueryClient({
      defaultOptions: {
        queries: {
          retry: (failureCount, error) =>
            !isNetworkError(error) && failureCount < 3,
        },
      },
    }),
  }
}
