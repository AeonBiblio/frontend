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
  complainActive?: boolean
  complainDisabled?: boolean
  coverSrc?: string
  description: string
  genre: string
  onAddToLibrary?: () => void
  onBuy?: () => void
  onComplain?: () => void
  onRead?: () => void
  onScoreSelect?: (score: number) => void
  paysAuthorFromSubscription: boolean
  rating: number
  ratingsCount: number
  reviewsCount: number
  selectedScore?: number | null
  scoreDisabled?: boolean
  showBuyButton?: boolean
  subscriptionLabel: string
  title: string
}

export function BookDetailsCard({
  author,
  buyLabel,
  className,
  complainActive,
  complainDisabled,
  coverSrc = shantaramCover,
  description,
  genre,
  onAddToLibrary,
  onBuy,
  onComplain,
  onRead,
  onScoreSelect,
  paysAuthorFromSubscription,
  rating,
  ratingsCount,
  reviewsCount,
  selectedScore,
  scoreDisabled,
  showBuyButton = true,
  subscriptionLabel,
  title,
}: BookDetailsCardProps) {
  return (
    <article className={clsx(styles.details, className)}>
      <BookCover
        coverSrc={coverSrc}
        paysAuthorFromSubscription={paysAuthorFromSubscription}
        title={title}
      />
      <BookInfo
        author={author}
        buyLabel={buyLabel}
        complainActive={complainActive}
        complainDisabled={complainDisabled}
        description={description}
        genre={genre}
        showBuyButton={showBuyButton}
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
        scoreDisabled={scoreDisabled}
        onScoreSelect={onScoreSelect}
      />
    </article>
  )
}
