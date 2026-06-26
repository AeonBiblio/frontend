import clsx from 'clsx'
import { Link } from '@tanstack/react-router'

import { Rating } from '@shared/ui/rating'

import shantaramCover from '@shared/assets/images/shantaram-cover.png'

import styles from './book-card.module.scss'

type BookCardProps = {
  title: string
  author: string
  className?: string
  coverSrc?: string
  subscriptionLabel: string
  priceLabel: string
  rating: number
}

export function BookCard({
  title,
  author,
  className,
  coverSrc = shantaramCover,
  subscriptionLabel,
  priceLabel,
  rating,
}: BookCardProps) {
  return (
    <article className={clsx(styles.card, className)}>
      <Link to="/login" className={styles.cardLink}>
        <img className={styles.cardCover} src={coverSrc} alt={title} />
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
