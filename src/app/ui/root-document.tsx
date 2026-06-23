import { TanStackDevtools } from '@tanstack/react-devtools'
import { HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { ServiceWorkerRegistration } from '@app/pwa/service-worker-registration'
import { tanStackQueryDevtools } from '@app/providers/tanstack-query/devtools'
import { useOutboxSync } from '@modules/offline/model'
import { apiClient } from '@shared/api/client/api-client'
import { ApiProvider } from '@shared/api/runtimeConfig/provider/provider'

import appStyles from '@app/styles/index.scss?url'
import styles from './root.module.scss'

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
      title: 'AeonBiblio',
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
    <html lang="ru">
      <head>
        <HeadContent />
      </head>
      <body className={styles.body}>
        <ApiProvider client={apiClient}>
          <main className={styles.main}>{children}</main>
        </ApiProvider>
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
