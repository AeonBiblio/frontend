/// <reference lib="webworker" />

import {
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkFirst,
  Serwist,
} from 'serwist'
import { defaultCache } from '@serwist/vite/worker'
import type { PrecacheEntry } from 'serwist'

import { OUTBOX_SYNC_TAG } from './modules/offline/model/outbox-event'
import { processOutboxFromServiceWorker } from './modules/offline/model/service-worker-delivery'

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
}

type BackgroundSyncEvent = ExtendableEvent & {
  tag: string
}

const OFFLINE_FALLBACK_URL = '/offline.html'
const APP_SHELL_URL = '/'
const APP_SHELL_CACHE = 'app-shell'
const NAVIGATION_CACHE = 'navigation-pages'

const injectedPrecacheEntries = self.__SW_MANIFEST ?? []

const hasOfflineFallback = injectedPrecacheEntries.some((entry) => {
  const url = typeof entry === 'string' ? entry : entry.url
  return new URL(url, self.location.origin).pathname === OFFLINE_FALLBACK_URL
})

const precacheEntries: (PrecacheEntry | string)[] = hasOfflineFallback
  ? injectedPrecacheEntries
  : [
      ...injectedPrecacheEntries,
      {
        url: OFFLINE_FALLBACK_URL,
        revision: 'offline-fallback-v1',
      },
    ]

function isAppRoute(pathname: string) {
  if (pathname === '/') return true

  return [
    '/library',
    '/books',
    '/reader',
    '/profile',
    '/publication',
    '/my-books',
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

async function getAppShell() {
  const appShellUrl = new URL(APP_SHELL_URL, self.location.origin).toString()

  const appShellCache = await caches.open(APP_SHELL_CACHE)
  const cachedShell = await appShellCache.match(appShellUrl)

  if (cachedShell) {
    return cachedShell
  }

  const navigationCache = await caches.open(NAVIGATION_CACHE)
  const cachedRootDocument = await navigationCache.match(appShellUrl)

  if (cachedRootDocument) {
    return cachedRootDocument
  }

  return null
}

const serwist = new Serwist({
  precacheEntries,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,

  runtimeCaching: [
    {
      matcher: ({ request, sameOrigin }) => {
        return sameOrigin && request.mode === 'navigate'
      },

      handler: new NetworkFirst({
        cacheName: NAVIGATION_CACHE,
        networkTimeoutSeconds: 3,
        plugins: [
          new CacheableResponsePlugin({
            statuses: [200],
          }),
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 7,
          }),
        ],
      }),
    },

    ...defaultCache,
  ],
})

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then(async (cache) => {
      const appShellUrl = new URL(
        APP_SHELL_URL,
        self.location.origin,
      ).toString()

      const response = await fetch(appShellUrl, {
        headers: {
          Accept: 'text/html',
        },
        credentials: 'same-origin',
      })

      if (response.ok) {
        await cache.put(appShellUrl, response)
      }
    }),
  )
})

serwist.setCatchHandler(async ({ request, url }) => {
  if (request.mode === 'navigate' || request.destination === 'document') {
    if (isAppRoute(url.pathname)) {
      const shell = await getAppShell()

      if (shell) {
        return shell
      }
    }

    const offlineFallback = await serwist.matchPrecache(OFFLINE_FALLBACK_URL)

    return offlineFallback ?? Response.error()
  }

  return Response.error()
})

serwist.addEventListeners()

self.addEventListener('sync', (event: Event) => {
  const syncEvent = event as BackgroundSyncEvent

  if (syncEvent.tag === OUTBOX_SYNC_TAG) {
    syncEvent.waitUntil(processOutboxFromServiceWorker())
  }
})
