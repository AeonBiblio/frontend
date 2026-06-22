/// <reference lib="webworker" />

import { Serwist } from 'serwist'

import type { PrecacheEntry } from 'serwist'
import { OUTBOX_SYNC_TAG } from './modules/offline/model/outbox-event'
import { processOutboxFromServiceWorker } from './modules/offline/model/service-worker-delivery'

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
}

type BackgroundSyncEvent = ExtendableEvent & {
  tag: string
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
})

serwist.addEventListeners()

self.addEventListener('sync', (event: Event) => {
  const syncEvent = event as BackgroundSyncEvent

  if (syncEvent.tag === OUTBOX_SYNC_TAG) {
    syncEvent.waitUntil(processOutboxFromServiceWorker())
  }
})
