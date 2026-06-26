import clsx from 'clsx'

import shantaramCover from '@shared/assets/images/shantaram-cover.png'

import { BookCover } from './components/book-cover'
import { BookInfo } from './components/book-info'
import { BookRating } from './components/book-rating'

import styles from './book-details-card.module.scss'

export type BookDetailsCardProps = {
  author: string
  buyLabel: string
  className?: string
  coverSrc?: string
  description: string
  genre: string
  onAddToLibrary?: () => void
  onBuy?: () => void
  onComplain?: () => void
  onRead?: () => void
  onScoreSelect?: (score: number) => void
  rating: number
  ratingsCount: number
  reviewsCount: number
  selectedScore?: number | null
  subscriptionLabel: string
  title: string
}

export function BookDetailsCard({
  author,
  buyLabel,
  className,
  coverSrc = shantaramCover,
  description,
  genre,
  onAddToLibrary,
  onBuy,
  onComplain,
  onRead,
  onScoreSelect,
  rating,
  ratingsCount,
  reviewsCount,
  selectedScore,
  subscriptionLabel,
  title,
}: BookDetailsCardProps) {
  return (
    <article className={clsx(styles.details, className)}>
      <BookCover coverSrc={coverSrc} title={title} />
      <BookInfo
        author={author}
        buyLabel={buyLabel}
        description={description}
        genre={genre}
        subscriptionLabel={subscriptionLabel}
        title={title}
        onAddToLibrary={onAddToLibrary}
        onBuy={onBuy}
        onComplain={onComplain}
        onRead={onRead}
      />
      <BookRating
        rating={rating}
        ratingsCount={ratingsCount}
        reviewsCount={reviewsCount}
        selectedScore={selectedScore}
        onScoreSelect={onScoreSelect}
      />
    </article>
  )
}
