import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'

import { useBookQuery, usePurchaseBookMutation } from '@modules/books/api'
import { getCardLastDigits, usePaymentProfileQuery } from '@modules/profile/api'
import { getCoverSrc } from '@shared/lib/get-cover-src'
import { CoverImage } from '@shared/ui/cover-image'
import { Spinner } from '@shared/ui/spinner/spinner'

import styles from './purchase-book-modal.module.scss'

type PurchaseBookModalProps = {
  bookId: string
  open: boolean
  onClose: () => void
  promoCode?: string
}

function formatRubles(value: string | null | undefined) {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return '-'
  }

  return `${amount.toLocaleString('ru-RU')} ₽`
}

export function PurchaseBookModal({
  bookId,
  open,
  onClose,
  promoCode,
}: PurchaseBookModalProps) {
  const bookQuery = useBookQuery(bookId, { enabled: open })
  const paymentProfileQuery = usePaymentProfileQuery({ enabled: open })
  const purchaseBook = usePurchaseBookMutation(bookId)

  if (!open) {
    return null
  }

  const book = bookQuery.data
  const cardLastDigits = getCardLastDigits(paymentProfileQuery.data)
  const bookLoading = bookQuery.isLoading
  const paymentLoading = paymentProfileQuery.isLoading
  const dataLoading = bookLoading || paymentLoading
  const dataError = bookQuery.isError || paymentProfileQuery.isError
  const canPay =
    Boolean(book) &&
    Boolean(cardLastDigits) &&
    !dataLoading &&
    !dataError &&
    !purchaseBook.isPending

  const handlePurchase = async () => {
    if (!cardLastDigits) {
      return
    }

    await purchaseBook.mutateAsync({
      promo_code: promoCode?.trim() || undefined,
    })
    onClose()
  }

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-book-title"
      >
        <button className={styles.modalClose} type="button" onClick={onClose}>
          <X aria-hidden="true" size={20} strokeWidth={2} />
        </button>

        <div className={styles.modalContent}>
          <h2 className={styles.modalTitle} id="purchase-book-title">
            {bookLoading ? (
              <span className={styles.modalTitleSkeleton} />
            ) : (
              <>Покупка книги{book ? ` "${book.title}"` : ''}</>
            )}
          </h2>

          {bookLoading ? (
            <div
              className={styles.modalCoverSkeleton}
              aria-label="Загружаем книгу"
            />
          ) : book ? (
            <CoverImage
              className={styles.modalCover}
              src={getCoverSrc(book.cover_key)}
              alt={book.title}
            />
          ) : (
            <p className={styles.modalError}>
              Не удалось получить данные книги.
            </p>
          )}

          <div className={styles.modalTotal}>
            <span>Итого к оплате</span>
            {bookLoading ? (
              <span className={styles.modalAmountSkeleton} />
            ) : (
              <strong>{formatRubles(book?.sale_price)}</strong>
            )}
          </div>

          {paymentLoading ? (
            <p className={styles.modalPaymentSkeleton} />
          ) : cardLastDigits ? (
            <p className={styles.modalTerms}>
              Платёж будет списан с карты •••• {cardLastDigits}.
            </p>
          ) : null}

          <div className={styles.modalPay}>
            <button
              className={styles.modalPayButton}
              type="button"
              disabled={!canPay}
              onClick={() => void handlePurchase()}
            >
              {purchaseBook.isPending ? <Spinner /> : 'Оплатить'}
            </button>
          </div>

          {!cardLastDigits && !paymentProfileQuery.isLoading && (
            <p className={styles.modalError}>Привяжите карту в профиле.</p>
          )}

          {(dataError || purchaseBook.isError) && (
            <p className={styles.modalError}>
              Не удалось выполнить запрос. Попробуйте снова.
            </p>
          )}

          <p className={styles.modalTerms}>
            Нажимая кнопку оплаты, вы принимаете условия{' '}
            <Link to=".">лицензионного договора</Link> и соглашаетесь с
            правилами приобретения товара.
          </p>
        </div>
      </div>
    </div>
  )
}
