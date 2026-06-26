import { BookActions } from './book-actions'
import { BookMeta } from './book-meta'

import styles from '../book-details-card.module.scss'

type BookInfoProps = {
  author: string
  buyLabel: string
  description: string
  genre: string
  onAddToLibrary?: () => void
  onBuy?: () => void
  onComplain?: () => void
  onRead?: () => void
  subscriptionLabel: string
  title: string
}

export function BookInfo({
  author,
  buyLabel,
  description,
  genre,
  onAddToLibrary,
  onBuy,
  onComplain,
  onRead,
  subscriptionLabel,
  title,
}: BookInfoProps) {
  return (
    <section className={styles.detailsInfo}>
      <h2 className={styles.detailsTitle}>{title}</h2>
      <BookActions
        buyLabel={buyLabel}
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
