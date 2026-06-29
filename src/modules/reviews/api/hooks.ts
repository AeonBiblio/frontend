import { useCallback, useEffect, useRef, useState } from 'react'

import { reviewRepository } from '@domain/repositories'
import { useAuthedMutation } from '@shared/api/core'
import { useApiClient } from '@shared/api/runtimeConfig/provider/provider'
import { reviewOutToLocalReview, useLiveQuery } from '@shared/lib/db'

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
  fetchNextPage: () => Promise<void>
  hasNextPage: boolean
  isError: boolean
  isFetching: boolean
  isFetchingNextPage: boolean
  isLoading: boolean
  refetch: () => Promise<void>
}

const defaultReviewsPageSize = 20

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
  {
    enabled = true,
    pageSize = defaultReviewsPageSize,
  }: { enabled?: boolean; pageSize?: number } = {},
): OfflineReviewsResult {
  const client = useApiClient()
  const [requestError, setRequestError] = useState<Error | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false)
  const [hasNextPage, setHasNextPage] = useState(true)
  const nextOffsetRef = useRef(0)
  const canLoad = enabled && Boolean(bookId)

  const { data: localReviews, error: liveQueryError } = useLiveQuery(
    () => {
      if (!canLoad) {
        return []
      }

      return reviewRepository.getByBookId(bookId)
    },
    [bookId, canLoad],
    [] as LocalReview[],
  )
  const data = localReviews
    .filter((review) => !review.deletedAt)
    .slice()
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    )
  const error = requestError ?? liveQueryError

  useEffect(() => {
    if (data.length > nextOffsetRef.current) {
      nextOffsetRef.current = data.length
    }
  }, [data.length])

  const fetchPage = useCallback(
    async (offset: number) => {
      const response = await client.get<ReviewOut[]>(
        `/books/${bookId}/reviews`,
        {
          params: { offset, limit: pageSize },
        },
      )

      await saveRemoteReviews(bookId, response.data)
      nextOffsetRef.current = offset + response.data.length
      setHasNextPage(response.data.length >= pageSize)
    },
    [bookId, client, pageSize],
  )

  const refetch = useCallback(async () => {
    if (!canLoad) {
      return
    }

    setIsFetching(true)
    setRequestError(null)
    setHasNextPage(true)
    nextOffsetRef.current = 0

    try {
      await fetchPage(0)
    } catch (caughtError) {
      setRequestError(
        caughtError instanceof Error
          ? caughtError
          : new Error(String(caughtError)),
      )
    } finally {
      setIsFetching(false)
    }
  }, [canLoad, fetchPage])

  const fetchNextPage = useCallback(async () => {
    if (!canLoad || isFetching || isFetchingNextPage || !hasNextPage) {
      return
    }

    setIsFetchingNextPage(true)
    setRequestError(null)

    try {
      await fetchPage(Math.max(nextOffsetRef.current, data.length))
    } catch (caughtError) {
      setRequestError(
        caughtError instanceof Error
          ? caughtError
          : new Error(String(caughtError)),
      )
    } finally {
      setIsFetchingNextPage(false)
    }
  }, [
    canLoad,
    data.length,
    fetchPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  ])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError: error !== null,
    isFetching,
    isFetchingNextPage,
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
  return useAuthedMutation<unknown, ReviewVoteBody>(
    `/reviews/${reviewId}/vote`,
    'put',
    {
      onMutate: async (body) => {
        const localReview = await reviewRepository.getById(reviewId)

        if (localReview) {
          await reviewRepository.save(updateVoteState(localReview, body.vote))
        }

        return undefined
      },
    },
  )
}

export function useDeleteReviewVoteMutation(reviewId: string) {
  return useAuthedMutation<unknown, void>(
    `/reviews/${reviewId}/vote`,
    'delete',
    {
      onMutate: async () => {
        const localReview = await reviewRepository.getById(reviewId)

        if (localReview) {
          await reviewRepository.save(updateVoteState(localReview, null))
        }

        return undefined
      },
    },
  )
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
