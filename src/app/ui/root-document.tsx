import { TanStackDevtools } from '@tanstack/react-devtools'
import { HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { HelmetProvider } from 'react-helmet-async'

import { ServiceWorkerRegistration } from '@app/pwa/service-worker-registration'
import { tanStackQueryDevtools } from '@app/providers/tanstack-query/devtools'
import { OutboxSyncGate } from '@modules/offline/model/outbox-sync-gate'
import { apiClient } from '@shared/api/client/api-client'
import { ApiProvider } from '@shared/api/runtimeConfig/provider/provider'

import { Header } from './header'
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
  return (
    <html lang="ru">
      <head>
        <HeadContent />
      </head>
      <body className={styles.body}>
        <HelmetProvider>
          <ApiProvider client={apiClient}>
            <Header />
            <main className={styles.main}>{children}</main>
          </ApiProvider>
        </HelmetProvider>
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
        <OutboxSyncGate />
        <ServiceWorkerRegistration />
        <Scripts />
      </body>
    </html>
  )
}
