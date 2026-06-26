import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterContextProvider } from '@tanstack/react-router'

import { getRouter } from '../src/router'
import { apiClient } from '../src/shared/api/client/api-client'
import { ApiProvider } from '../src/shared/api/runtimeConfig/provider/provider'
import '../src/app/styles/index.scss'

import type { Preview } from '@storybook/react-vite'

const router = getRouter()
const queryClient = new QueryClient()

const preview: Preview = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <ApiProvider client={apiClient}>
          <RouterContextProvider router={router}>
            <Story />
          </RouterContextProvider>
        </ApiProvider>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
