import { useMutation } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import { reviewRepository } from '@domain/repositories'
import { useAuthedMutation } from '@shared/api/core'
import { useSessionQuery } from '@shared/api/auth'
import { useApiClient } from '@shared/api/runtimeConfig/provider/provider'
import {
  db,
  reviewOutToLocalReview,
  useLiveQuery,
} from '@shared/lib/db'
import {
  createOutboxItem,
  flushOutboxSoon,
} from '@modules/offline/model/enqueue-outbox-item'

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

function createId() {
  return globalThis.crypto.randomUUID()
}

function localReviewToOut(review: LocalReview): ReviewOut {
  return {
    id: review.id,
    user_id: review.userId,
    username: review.username,
    display_tag: review.displayTag,
    avatar_key: review.avatarKey,
    rating: review.rating,
    sentiment: review.sentiment,
    text: review.text,
    promo_issued: review.promoIssued,
    likes_count: review.likesCount,
    dislikes_count: review.dislikesCount,
    my_vote: review.myVote,
    created_at: review.createdAt,
  }
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
  const localReviews = await Promise.all(
    reviews.map(async (review) => ({
      remote: review,
      local: await reviewRepository.getById(review.id),
    })),
  )
  const writableReviews = localReviews
    .filter(({ local }) => !local?.dirty)
    .map(({ remote }) => reviewOutToLocalReview(remote, bookId))

  if (writableReviews.length > 0) {
    await reviewRepository.saveMany(writableReviews)
  }
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
  const session = useSessionQuery({ enabled: true })

  return useMutation<ReviewOut, Error, CreateReviewBody>({
    mutationFn: async (body) => {
      const user = session.data

      if (!user) {
        throw new Error('Not authorized')
      }

      const now = new Date().toISOString()
      const review: LocalReview = {
        id: createId(),
        bookId,
        userId: user.id,
        username: user.username,
        displayTag: user.displayTag,
        avatarKey: user.avatarKey,
        rating: body.rating,
        sentiment: body.sentiment,
        text: body.text,
        promoIssued: false,
        likesCount: 0,
        dislikesCount: 0,
        myVote: null,
        createdAt: now,
        updatedAt: now,
        dirty: true,
      }

      await db.transaction('rw', db.reviews, db.outbox, async () => {
        await db.reviews.put(review)
        await db.outbox.put(
          createOutboxItem({
            type: 'http.request',
            entityId: review.id,
            userId: user.id,
            bookId,
            payload: {
              method: 'post',
              path: `/books/${bookId}/reviews`,
              body,
            },
          }),
        )
      })

      flushOutboxSoon()

      return localReviewToOut(review)
    },
  })
}

export function useUpdateReviewMutation(reviewId: string) {
  const session = useSessionQuery({ enabled: true })

  return useMutation<ReviewOut, Error, UpdateReviewBody>({
    mutationFn: async (body) => {
      const user = session.data

      if (!user) {
        throw new Error('Not authorized')
      }

      let updatedReview!: LocalReview

      await db.transaction('rw', db.reviews, db.outbox, async () => {
        const localReview = await db.reviews.get(reviewId)

        if (!localReview) {
          throw new Error('Review is not available offline')
        }

        updatedReview = {
          ...localReview,
          ...(body.rating !== undefined ? { rating: body.rating } : {}),
          ...(body.sentiment !== undefined
            ? { sentiment: body.sentiment }
            : {}),
          ...(body.text !== undefined ? { text: body.text } : {}),
          dirty: true,
          updatedAt: new Date().toISOString(),
        }

        await db.reviews.put(updatedReview)
        await db.outbox.put(
          createOutboxItem({
            type: 'http.request',
            entityId: reviewId,
            userId: user.id,
            bookId: updatedReview.bookId,
            payload: {
              method: 'patch',
              path: `/reviews/${reviewId}`,
              body,
            },
          }),
        )
      })

      flushOutboxSoon()

      return localReviewToOut(updatedReview)
    },
  })
}

export function useDeleteReviewMutation(reviewId: string) {
  const session = useSessionQuery({ enabled: true })

  return useMutation<unknown, Error, void>({
    mutationFn: async () => {
      const user = session.data

      if (!user) {
        throw new Error('Not authorized')
      }

      await db.transaction('rw', db.reviews, db.outbox, async () => {
        const localReview = await db.reviews.get(reviewId)

        if (!localReview) {
          throw new Error('Review is not available offline')
        }

        await db.reviews.put({
          ...localReview,
          deletedAt: new Date().toISOString(),
          dirty: true,
          updatedAt: new Date().toISOString(),
        })
        await db.outbox.put(
          createOutboxItem({
            type: 'http.request',
            entityId: reviewId,
            userId: user.id,
            bookId: localReview.bookId,
            payload: {
              method: 'delete',
              path: `/reviews/${reviewId}`,
            },
          }),
        )
      })

      flushOutboxSoon()
    },
  })
}

export function useReviewVoteMutation(reviewId: string) {
  const session = useSessionQuery({ enabled: true })

  return useMutation<unknown, Error, ReviewVoteBody>({
    mutationFn: async (body) => {
      const user = session.data

      if (!user) {
        throw new Error('Not authorized')
      }

      await db.transaction('rw', db.reviews, db.outbox, async () => {
        const localReview = await db.reviews.get(reviewId)

        if (!localReview) {
          throw new Error('Review is not available offline')
        }

        await db.reviews.put(updateVoteState(localReview, body.vote))
        await db.outbox.put(
          createOutboxItem({
            type: 'http.request',
            entityId: reviewId,
            userId: user.id,
            bookId: localReview.bookId,
            payload: {
              method: 'put',
              path: `/reviews/${reviewId}/vote`,
              body,
            },
          }),
        )
      })

      flushOutboxSoon()
    },
  })
}

export function useDeleteReviewVoteMutation(reviewId: string) {
  const session = useSessionQuery({ enabled: true })

  return useMutation<unknown, Error, void>({
    mutationFn: async () => {
      const user = session.data

      if (!user) {
        throw new Error('Not authorized')
      }

      await db.transaction('rw', db.reviews, db.outbox, async () => {
        const localReview = await db.reviews.get(reviewId)

        if (!localReview) {
          throw new Error('Review is not available offline')
        }

        await db.reviews.put(updateVoteState(localReview, null))
        await db.outbox.put(
          createOutboxItem({
            type: 'http.request',
            entityId: reviewId,
            userId: user.id,
            bookId: localReview.bookId,
            payload: {
              method: 'delete',
              path: `/reviews/${reviewId}/vote`,
            },
          }),
        )
      })

      flushOutboxSoon()
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
