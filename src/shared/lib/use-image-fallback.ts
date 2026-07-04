import { useEffect, useMemo, useState } from 'react'

export function useImageFallback(src: string, fallbackSrc: string) {
  const initialSrc = useMemo(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return fallbackSrc
    }

    return src
  }, [fallbackSrc, src])

  const [resolvedSrc, setResolvedSrc] = useState(initialSrc)

  useEffect(() => {
    setResolvedSrc(initialSrc)
  }, [initialSrc])

  const handleError = () => {
    setResolvedSrc(fallbackSrc)
  }

  return {
    onError: handleError,
    src: resolvedSrc,
  }
}
