import { BookActions } from './book-actions'
import { BookMeta } from './book-meta'

import styles from '../book-details-card.module.scss'

type BookInfoProps = {
  author: string
  buyLabel: string
  complainActive?: boolean
  complainDisabled?: boolean
  description: string
  genre: string
  onAddToLibrary?: () => void
  onBuy?: () => void
  onComplain?: () => void
  onRead?: () => void
  readDisabled?: boolean
  showBuyButton?: boolean
  subscriptionLabel: string
  title: string
}

export function BookInfo({
  author,
  buyLabel,
  complainActive,
  complainDisabled,
  description,
  genre,
  onAddToLibrary,
  onBuy,
  onComplain,
  onRead,
  readDisabled,
  showBuyButton,
  subscriptionLabel,
  title,
}: BookInfoProps) {
  return (
    <section className={styles.detailsInfo}>
      <h2 className={styles.detailsTitle}>{title}</h2>
      <BookActions
        buyLabel={buyLabel}
        complainActive={complainActive}
        complainDisabled={complainDisabled}
        readDisabled={readDisabled}
        showBuyButton={showBuyButton}
        subscriptionLabel={subscriptionLabel}
        onAddToLibrary={onAddToLibrary}
        onBuy={onBuy}
        onComplain={onComplain}
        onRead={onRead}
      />
      <p className={styles.detailsDescription}>{description}</p>
      <BookMeta author={author} genre={genre} />
    </section>
  )
}
