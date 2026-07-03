export function now() {
  return new Date().toISOString()
}

export function getHeaderValue(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

export function throwIfAborted(signal: AbortSignal | undefined) {
  if (signal?.aborted) {
    throw new DOMException('Reader download aborted', 'AbortError')
  }
}
