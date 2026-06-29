import { useVirtualizer } from '@tanstack/react-virtual'
import clsx from 'clsx'
import { useEffect, useRef } from 'react'

import { useBookReviewsQuery } from '@modules/reviews/api'
import { ReviewCard } from '@modules/reviews/ui/review-card'
import { useSessionQuery } from '@shared/api/auth'
import { getAvatarSrc } from '@shared/lib/get-avatar-src'

import styles from './review-list.module.scss'

import type { CSSProperties } from 'react'

export type ReviewListProps = {
  bookId: string
  canIssuePromo?: boolean
  className?: string
  enabled?: boolean
  height?: number
  pageSize?: number
}

const loadMoreThreshold = 4

export function ReviewList({
  bookId,
  canIssuePromo = false,
  className,
  enabled = true,
  height = 680,
  pageSize,
}: ReviewListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const sessionQuery = useSessionQuery()
  const currentUserId = sessionQuery.data?.id
  const {
    data: reviews,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useBookReviewsQuery(bookId, { enabled, pageSize })
  const rowCount = hasNextPage ? reviews.length + 1 : reviews.length
  const virtualizer = useVirtualizer({
    count: rowCount,
    estimateSize: (index) => (index >= reviews.length ? 52 : 316),
    getScrollElement: () => parentRef.current,
    getItemKey: (index) => reviews[index]?.id ?? `loader-${index}`,
    overscan: 5,
  })
  const virtualItems = virtualizer.getVirtualItems()
  const lastVirtualIndex = virtualItems.at(-1)?.index ?? -1

  useEffect(() => {
    if (lastVirtualIndex < 0 || !hasNextPage || isFetchingNextPage) {
      return
    }

    if (lastVirtualIndex >= reviews.length - loadMoreThreshold) {
      void fetchNextPage()
    }
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    lastVirtualIndex,
    reviews.length,
  ])

  const containerStyle = {
    '--review-list-height': `${height}px`,
  } as CSSProperties

  if (isLoading && reviews.length === 0) {
    return (
      <section className={clsx(styles.list, className)}>
        <p className={styles.state}>Загружаем отзывы...</p>
      </section>
    )
  }

  if (reviews.length === 0) {
    return (
      <section className={clsx(styles.list, className)}>
        <p className={styles.state}>
          {error ? 'Не удалось загрузить отзывы' : 'Отзывов пока нет'}
        </p>
      </section>
    )
  }

  return (
    <section className={clsx(styles.list, className)}>
      <div ref={parentRef} className={styles.viewport} style={containerStyle}>
        <div
          className={styles.spacer}
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualItems.map((virtualItem) => {
            if (virtualItem.index >= reviews.length) {
              return (
                <div
                  key={virtualItem.key}
                  ref={virtualizer.measureElement}
                  className={clsx(styles.item, styles.loaderItem)}
                  data-index={virtualItem.index}
                  style={{ transform: `translateY(${virtualItem.start}px)` }}
                >
                  <p className={styles.loading}>
                    {isFetchingNextPage
                      ? 'Загружаем еще отзывы...'
                      : 'Прокрутите ниже, чтобы загрузить еще'}
                  </p>
                </div>
              )
            }

            const review = reviews[virtualItem.index]

            return (
              <div
                key={virtualItem.key}
                ref={virtualizer.measureElement}
                className={styles.item}
                data-index={virtualItem.index}
                style={{ transform: `translateY(${virtualItem.start}px)` }}
              >
                <ReviewCard
                  id={review.id}
                  canIssuePromo={
                    canIssuePromo && currentUserId !== review.userId
                  }
                  canManage={currentUserId === review.userId}
                  createdAt={review.createdAt}
                  displayTag={review.displayTag}
                  avatarSrc={getAvatarSrc(review.avatarKey)}
                  dislikesCount={review.dislikesCount}
                  likesCount={review.likesCount}
                  myVote={review.myVote}
                  promoIssued={review.promoIssued}
                  sentiment={review.sentiment}
                  text={review.text}
                  username={review.username}
                />
              </div>
            )
          })}
        </div>
      </div>

      {error && <p className={styles.error}>Не удалось обновить отзывы</p>}
    </section>
  )
}
