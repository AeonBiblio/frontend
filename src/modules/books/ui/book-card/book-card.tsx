import clsx from 'clsx'
import { Link } from '@tanstack/react-router'

import { Rating } from '@shared/ui/rating'
import { CoverImage } from '@shared/ui/cover-image'

import shantaramCover from '@shared/assets/images/shantaram-cover.png'

import styles from './book-card.module.scss'

type BookCardProps = {
  title: string
  author: string
  bookId: string
  className?: string
  coverSrc?: string
  subscriptionLabel: string
  priceLabel: string
  imageFetchPriority?: 'high' | 'low' | 'auto'
  imageLoading?: 'eager' | 'lazy'
  rating: number
}

export function BookCard({
  title,
  author,
  bookId,
  className,
  coverSrc = shantaramCover,
  subscriptionLabel,
  priceLabel,
  imageLoading,
  imageFetchPriority,
  rating,
}: BookCardProps) {
  return (
    <article className={clsx(styles.card, className)}>
      <Link to="/books/$bookId" params={{ bookId }} className={styles.cardLink}>
        <CoverImage
          className={styles.cardCover}
          loading={imageLoading}
          fetchPriority={imageFetchPriority}
          src={coverSrc}
          alt={title}
        />
        <div className={styles.cardContent}>
          <div className={styles.cardMeta}>
            <h2 className={styles.cardTitle}>{title}</h2>
            <p className={styles.cardAuthor}>{author}</p>
          </div>
          <div className={styles.cardFooter}>
            <p className={styles.cardOffer}>
              <span className={styles.cardSubscription}>
                {subscriptionLabel}
              </span>
              <span className={styles.cardPrice}>{priceLabel}</span>
            </p>
            <Rating value={rating} className={styles.cardRating} />
          </div>
        </div>
      </Link>
    </article>
  )
}
