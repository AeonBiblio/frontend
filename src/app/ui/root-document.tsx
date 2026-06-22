import { TanStackDevtools } from '@tanstack/react-devtools'
import { HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { ServiceWorkerRegistration } from '@app/pwa/service-worker-registration'
import { tanStackQueryDevtools } from '@app/providers/tanstack-query/devtools'
import { useOutboxSync } from '@modules/offline/model'

import appStyles from '@app/styles/index.scss?url'

import type { ReactNode } from 'react'

export const rootHead = {
  meta: [
    {
      charSet: 'utf-8',
    },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
    {
      title: 'TanStack Start Starter',
    },
  ],
  links: [
    {
      rel: 'stylesheet',
      href: appStyles,
    },
    {
      rel: 'manifest',
      href: '/manifest.json',
    },
  ],
}

export function RootDocument({ children }: { children: ReactNode }) {
  useOutboxSync()

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            tanStackQueryDevtools,
          ]}
        />
        <ServiceWorkerRegistration />
        <Scripts />
      </body>
    </html>
  )
}
