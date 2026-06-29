import { liveQuery } from 'dexie'
import { useEffect, useState } from 'react'

type LiveQueryResult<T> = {
  data: T
  error: Error | null
}

export function useLiveQuery<T>(
  query: () => Promise<T> | T,
  deps: readonly unknown[],
  initialValue: T,
): LiveQueryResult<T> {
  const [data, setData] = useState<T>(initialValue)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const subscription = liveQuery(query).subscribe({
      next: (value) => {
        setData(value)
        setError(null)
      },
      error: (subscriptionError) => {
        setError(
          subscriptionError instanceof Error
            ? subscriptionError
            : new Error(String(subscriptionError)),
        )
      },
    })

    return () => subscription.unsubscribe()
  }, deps)

  return { data, error }
}
