import { flushOutbox } from './flush-outbox'

export function startOutboxSync() {
  const sync = () => {
    void flushOutbox()
  }

  sync()
  window.addEventListener('online', sync)
  window.addEventListener('focus', sync)

  const intervalId = window.setInterval(sync, 60_000)

  return () => {
    window.removeEventListener('online', sync)
    window.removeEventListener('focus', sync)
    window.clearInterval(intervalId)
  }
}
