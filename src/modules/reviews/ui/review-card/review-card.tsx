import clsx from 'clsx'
import { Heart, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import {
  useDeleteReviewVoteMutation,
  useReviewVoteMutation,
} from '@modules/reviews/api'
import profileAvatar from '@shared/assets/images/profile-avatar.png'

import styles from './review-card.module.scss'

import type { ReviewSentiment, ReviewVoteType } from '@shared/api/core'

const collapsedTextHeight = 70

export type ReviewCardProps = {
  avatarSrc?: string
  className?: string
  createdAt?: string
  displayTag?: string | null
  dislikesCount?: number
  likesCount?: number
  myVote?: ReviewVoteType | null
  promoIssued?: boolean
  id?: string
  sentiment: ReviewSentiment
  text: string
  username: string
}

function formatDate(value: string | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function ReviewCard({
  avatarSrc = profileAvatar,
  className,
  createdAt,
  displayTag,
  dislikesCount = 0,
  likesCount = 0,
  myVote,
  promoIssued = false,
  id,
  sentiment,
  text,
  username,
}: ReviewCardProps) {
  const date = formatDate(createdAt)
  const textRef = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [textOverflowing, setTextOverflowing] = useState(false)
  const voteMutation = useReviewVoteMutation(id ?? '')
  const deleteVoteMutation = useDeleteReviewVoteMutation(id ?? '')
  const votePending = voteMutation.isPending || deleteVoteMutation.isPending

  useEffect(() => {
    const element = textRef.current

    if (!element) {
      return
    }

    const measure = () => {
      setTextOverflowing(element.scrollHeight > collapsedTextHeight)
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(element)

    return () => observer.disconnect()
  }, [text])

  const handleVote = (vote: ReviewVoteType) => {
    if (!id || votePending) {
      return
    }

    if (myVote === vote) {
      deleteVoteMutation.mutate()
      return
    }

    voteMutation.mutate({ vote })
  }

  return (
    <article
      className={clsx(styles.card, className)}
      data-sentiment={sentiment}
    >
      <header className={styles.cardHeader}>
        <div className={styles.cardAuthor}>
          <img className={styles.cardAvatar} src={avatarSrc} alt="" />
          <span className={styles.cardName}>
            {username}
            {displayTag && <> {displayTag}</>}
          </span>
        </div>
        {date && (
          <time className={styles.cardDate} dateTime={createdAt}>
            {date}
          </time>
        )}
      </header>

      <p
        ref={textRef}
        className={styles.cardText}
        data-expanded={expanded || undefined}
      >
        {text}
      </p>

      <footer className={styles.cardFooter}>
        {textOverflowing ? (
          <button
            className={styles.cardMore}
            type="button"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? 'Свернуть' : 'Показать полностью'}
          </button>
        ) : (
          <span className={styles.cardFooterSpacer} />
        )}

        <div className={styles.cardActions}>
          {promoIssued && (
            <span className={styles.cardPromo}>
              <Heart aria-hidden="true" fill="currentColor" size={17} />
              Автор выдал купон
            </span>
          )}

          <button
            className={styles.cardVote}
            type="button"
            data-active={myVote === 'like' || undefined}
            disabled={!id || votePending}
            onClick={() => handleVote('like')}
          >
            <ThumbsUp aria-hidden="true" size={18} />
            {likesCount}
          </button>
          <button
            className={styles.cardVote}
            type="button"
            data-active={myVote === 'dislike' || undefined}
            disabled={!id || votePending}
            onClick={() => handleVote('dislike')}
          >
            <ThumbsDown aria-hidden="true" size={18} />
            {dislikesCount}
          </button>
        </div>
      </footer>
    </article>
  )
}
