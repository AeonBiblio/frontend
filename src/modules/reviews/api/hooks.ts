import { useMutation } from '@tanstack/react-query'
import { liveQuery } from 'dexie'
import { useCallback, useEffect, useState } from 'react'

import { reviewRepository } from '@domain/repositories'
import { useAuthedMutation } from '@shared/api/core'
import { useApiClient } from '@shared/api/runtimeConfig/provider/provider'
import { reviewOutToLocalReview } from '@shared/lib/db'

import type {
  CreatePromoCodeBody,
  CreateReviewBody,
  ReviewOut,
  ReviewVoteBody,
  UpdateReviewBody,
} from '@shared/api/core'
import type { LocalReview, ReviewVoteType } from '@shared/lib/db'

export const reviewKeys = {
  byBook: (bookId: string) => ['reviews', 'book', bookId] as const,
}

type OfflineReviewsResult = {
  data: LocalReview[]
  error: Error | null
  isError: boolean
  isFetching: boolean
  isLoading: boolean
  refetch: () => Promise<void>
}

function updateVoteState(
  review: LocalReview,
  nextVote: ReviewVoteType | null,
): LocalReview {
  const likesCount =
    review.likesCount -
    (review.myVote === 'like' ? 1 : 0) +
    (nextVote === 'like' ? 1 : 0)
  const dislikesCount =
    review.dislikesCount -
    (review.myVote === 'dislike' ? 1 : 0) +
    (nextVote === 'dislike' ? 1 : 0)

  return {
    ...review,
    likesCount: Math.max(0, likesCount),
    dislikesCount: Math.max(0, dislikesCount),
    myVote: nextVote,
    updatedAt: new Date().toISOString(),
  }
}

async function saveRemoteReviews(bookId: string, reviews: ReviewOut[]) {
  await reviewRepository.saveMany(
    reviews.map((review) => reviewOutToLocalReview(review, bookId)),
  )
}

async function saveRemoteReview(review: ReviewOut, fallbackBookId?: string) {
  const localReview = await reviewRepository.getById(review.id)
  const bookId = fallbackBookId ?? localReview?.bookId

  if (!bookId) {
    return
  }

  await reviewRepository.save(reviewOutToLocalReview(review, bookId))
}

async function removeLocalReview(reviewId: string) {
  await reviewRepository.remove(reviewId)
}

export function useBookReviewsQuery(
  bookId: string,
  { enabled = true }: { enabled?: boolean } = {},
): OfflineReviewsResult {
  const client = useApiClient()
  const [data, setData] = useState<LocalReview[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const canLoad = enabled && Boolean(bookId)

  useEffect(() => {
    if (!canLoad) {
      setData([])
      return
    }

    const subscription = liveQuery(() =>
      reviewRepository.getByBookId(bookId),
    ).subscribe({
      next: (reviews) => setData(reviews.filter((review) => !review.deletedAt)),
      error: (subscriptionError) => {
        setError(
          subscriptionError instanceof Error
            ? subscriptionError
            : new Error(String(subscriptionError)),
        )
      },
    })

    return () => subscription.unsubscribe()
  }, [bookId, canLoad])

  const refetch = useCallback(async () => {
    if (!canLoad) {
      return
    }

    setIsFetching(true)
    setError(null)

    try {
      const response = await client.get<ReviewOut[]>(`/books/${bookId}/reviews`)
      await saveRemoteReviews(bookId, response.data)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError
          : new Error(String(requestError)),
      )
    } finally {
      setIsFetching(false)
    }
  }, [bookId, canLoad, client])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return {
    data,
    error,
    isError: error !== null,
    isFetching,
    isLoading: canLoad && isFetching && data.length === 0,
    refetch,
  }
}

export function useCreateReviewMutation(bookId: string) {
  return useAuthedMutation<ReviewOut, CreateReviewBody>(
    `/books/${bookId}/reviews`,
    'post',
    {
      onSuccess: (review) => {
        void saveRemoteReview(review, bookId)
      },
    },
  )
}

export function useUpdateReviewMutation(reviewId: string) {
  return useAuthedMutation<ReviewOut, UpdateReviewBody>(
    `/reviews/${reviewId}`,
    'patch',
    {
      onMutate: async (body) => {
        const localReview = await reviewRepository.getById(reviewId)

        if (localReview) {
          await reviewRepository.save({
            ...localReview,
            ...('rating' in body && body.rating ? { rating: body.rating } : {}),
            ...('sentiment' in body && body.sentiment
              ? { sentiment: body.sentiment }
              : {}),
            ...('text' in body && body.text ? { text: body.text } : {}),
            dirty: true,
            updatedAt: new Date().toISOString(),
          })
        }

        return undefined
      },
      onSuccess: (review) => {
        void saveRemoteReview(review)
      },
    },
  )
}

export function useDeleteReviewMutation(reviewId: string) {
  return useAuthedMutation<unknown, void>(`/reviews/${reviewId}`, 'delete', {
    onMutate: async () => {
      const localReview = await reviewRepository.getById(reviewId)

      if (localReview) {
        await reviewRepository.save({
          ...localReview,
          deletedAt: new Date().toISOString(),
          dirty: true,
          updatedAt: new Date().toISOString(),
        })
      }

      return undefined
    },
    onSuccess: () => {
      void removeLocalReview(reviewId)
    },
  })
}

export function useReviewVoteMutation(reviewId: string) {
  const client = useApiClient()

  return useMutation<unknown, Error, ReviewVoteBody>({
    mutationFn: async (body) => {
      const localReview = await reviewRepository.getById(reviewId)

      if (localReview) {
        await reviewRepository.save(updateVoteState(localReview, body.vote))
      }

      const response = await client.put(`/reviews/${reviewId}/vote`, body)

      return response.data
    },
  })
}

export function useDeleteReviewVoteMutation(reviewId: string) {
  const client = useApiClient()

  return useMutation<unknown, Error, void>({
    mutationFn: async () => {
      const localReview = await reviewRepository.getById(reviewId)

      if (localReview) {
        await reviewRepository.save(updateVoteState(localReview, null))
      }

      const response = await client.delete(`/reviews/${reviewId}/vote`)

      return response.data
    },
  })
}

export function useCreateReviewPromoCodeMutation(reviewId: string) {
  return useAuthedMutation<unknown, CreatePromoCodeBody>(
    `/reviews/${reviewId}/promo-code`,
    'post',
    {
      onMutate: async () => {
        const localReview = await reviewRepository.getById(reviewId)

        if (localReview) {
          await reviewRepository.save({
            ...localReview,
            promoIssued: true,
            updatedAt: new Date().toISOString(),
          })
        }

        return undefined
      },
    },
  )
}
