import clsx from 'clsx'
import { Heart, Pencil, ThumbsDown, ThumbsUp, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import {
  useDeleteReviewMutation,
  useDeleteReviewVoteMutation,
  useCreateReviewPromoCodeMutation,
  useReviewVoteMutation,
  useUpdateReviewMutation,
} from '@modules/reviews/api'
import profileAvatar from '@shared/assets/images/profile-avatar.png'
import { getOnlineAwareAvatarSrc } from '@shared/lib/get-avatar-src'
import { useImageFallback } from '@shared/lib/use-image-fallback'

import styles from './review-card.module.scss'

import type { ReviewSentiment, ReviewVoteType } from '@shared/api/core'

const collapsedTextHeight = 70

export type ReviewCardProps = {
  avatarKey?: string | null
  avatarSrc?: string
  canIssuePromo?: boolean
  canManage?: boolean
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

const sentimentOptions: Array<{ label: string; value: ReviewSentiment }> = [
  { label: 'Положительная', value: 'positive' },
  { label: 'Нейтральная', value: 'neutral' },
  { label: 'Отрицательная', value: 'negative' },
]

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
  avatarKey,
  avatarSrc = profileAvatar,
  canIssuePromo = false,
  canManage = false,
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
  const avatar = useImageFallback(
    getOnlineAwareAvatarSrc(avatarKey, avatarKey ? undefined : avatarSrc),
    profileAvatar,
  )
  const date = formatDate(createdAt)
  const textRef = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [editSentiment, setEditSentiment] = useState(sentiment)
  const [editText, setEditText] = useState(text)
  const [editing, setEditing] = useState(false)
  const [textOverflowing, setTextOverflowing] = useState(false)
  const deleteReview = useDeleteReviewMutation(id ?? '')
  const updateReview = useUpdateReviewMutation(id ?? '')
  const createPromoCode = useCreateReviewPromoCodeMutation(id ?? '')
  const voteMutation = useReviewVoteMutation(id ?? '')
  const deleteVoteMutation = useDeleteReviewVoteMutation(id ?? '')
  const editPending = deleteReview.isPending || updateReview.isPending
  const votePending = voteMutation.isPending || deleteVoteMutation.isPending
  const canShowIssuePromo = canIssuePromo && !promoIssued

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

  useEffect(() => {
    setEditSentiment(sentiment)
    setEditText(text)
  }, [sentiment, text])

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

  const handleDelete = () => {
    if (!id || editPending) {
      return
    }

    if (!window.confirm('Удалить отзыв?')) {
      return
    }

    deleteReview.mutate()
  }

  const handleUpdate = () => {
    const nextText = editText.trim()

    if (!id || editPending || !nextText) {
      return
    }

    updateReview.mutate(
      {
        sentiment: editSentiment,
        text: nextText,
      },
      {
        onSuccess: () => setEditing(false),
      },
    )
  }

  const handleCancelEdit = () => {
    setEditSentiment(sentiment)
    setEditText(text)
    setEditing(false)
  }

  const handleIssuePromo = () => {
    if (!id || createPromoCode.isPending) {
      return
    }

    createPromoCode.mutate({
      discount_percent: 10,
      expires_in_days: 30,
    })
  }

  return (
    <article
      className={clsx(styles.card, className)}
      data-sentiment={sentiment}
    >
      <header className={styles.cardHeader}>
        <div className={styles.cardAuthor}>
          <img
            className={styles.cardAvatar}
            src={avatar.src}
            alt=""
            onError={avatar.onError}
          />
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
        {canManage && (
          <div className={styles.cardManage}>
            <button
              className={styles.cardManageButton}
              type="button"
              aria-label="Редактировать отзыв"
              disabled={!id || editPending}
              onClick={() => setEditing(true)}
            >
              <Pencil aria-hidden="true" size={15} />
            </button>
            <button
              className={styles.cardManageButton}
              type="button"
              aria-label="Удалить отзыв"
              disabled={!id || editPending}
              onClick={handleDelete}
            >
              <Trash2 aria-hidden="true" size={15} />
            </button>
          </div>
        )}
      </header>

      {editing ? (
        <div className={styles.cardEditor}>
          <div className={styles.cardSentiments} role="radiogroup">
            {sentimentOptions.map((option) => (
              <button
                className={styles.cardSentiment}
                type="button"
                key={option.value}
                role="radio"
                aria-checked={editSentiment === option.value}
                data-active={editSentiment === option.value || undefined}
                disabled={editPending}
                onClick={() => setEditSentiment(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <textarea
            className={styles.cardTextarea}
            value={editText}
            disabled={editPending}
            onChange={(event) => setEditText(event.target.value)}
          />
          <div className={styles.cardEditorActions}>
            <button
              className={styles.cardSave}
              type="button"
              disabled={editPending || !editText.trim()}
              onClick={handleUpdate}
            >
              Сохранить
            </button>
            <button
              className={styles.cardCancel}
              type="button"
              disabled={editPending}
              onClick={handleCancelEdit}
            >
              <X aria-hidden="true" size={14} />
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <p
          ref={textRef}
          className={styles.cardText}
          data-expanded={expanded || undefined}
        >
          {text}
        </p>
      )}

      <footer className={styles.cardFooter}>
        {!editing && textOverflowing ? (
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
          {canShowIssuePromo && (
            <button
              className={styles.cardPromoButton}
              type="button"
              disabled={!id || createPromoCode.isPending}
              onClick={handleIssuePromo}
            >
              Выдать купон
            </button>
          )}

          {promoIssued && (
            <span className={styles.cardPromo}>
              <Heart aria-hidden="true" fill="currentColor" size={17} />
              Автор выдал купон
            </span>
          )}

          <button
            className={clsx(
              styles.cardVote,
              myVote === 'like' && styles.cardVoteLikeActive,
            )}
            type="button"
            data-active={myVote === 'like' || undefined}
            disabled={!id || votePending}
            onClick={() => handleVote('like')}
          >
            <ThumbsUp aria-hidden="true" size={18} />
            {likesCount}
          </button>
          <button
            className={clsx(
              styles.cardVote,
              myVote === 'dislike' && styles.cardVoteDislikeActive,
            )}
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
