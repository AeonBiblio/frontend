/// <reference lib="webworker" />

import { Serwist } from 'serwist'

import type { PrecacheEntry } from 'serwist'

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
})

serwist.addEventListeners()
