/// <reference lib="webworker" />

import { NetworkOnly, Serwist } from 'serwist'
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
const LEGACY_NAVIGATION_CACHE = 'navigation-pages'
const LEGACY_IMAGE_CACHE = 'static-image-assets'
const LEGACY_OTHERS_CACHE = 'others'

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

function isBookContentRoute(pathname: string) {
  return /^\/books\/[^/]+\/content$/.test(pathname)
}

async function getAppShell() {
  const appShellUrl = new URL(APP_SHELL_URL, self.location.origin).toString()

  const appShellCache = await caches.open(APP_SHELL_CACHE)
  return appShellCache.match(appShellUrl)
}

const serwist = new Serwist({
  precacheEntries,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,

  runtimeCaching: [
    {
      matcher: ({ request, url }) =>
        request.destination === 'image' || isBookContentRoute(url.pathname),
      handler: new NetworkOnly(),
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

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.delete(LEGACY_NAVIGATION_CACHE),
      caches.delete(LEGACY_IMAGE_CACHE),
      caches.delete(LEGACY_OTHERS_CACHE),
    ]),
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
