import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'

import { useBookQuery, usePurchaseBookMutation } from '@modules/books/api'
import { usePaymentProfileQuery } from '@modules/profile/api'
import { Spinner } from '@shared/ui/spinner/spinner'

import shantaramCover from '@shared/assets/images/shantaram-cover.png'

import styles from './purchase-book-modal.module.scss'

import type { CardPaymentBody } from '@shared/api/core'
import type { PaymentProfile } from '@modules/profile/api'

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

function getCoverSrc(coverKey: string | null | undefined) {
  return coverKey || shantaramCover
}

function getPaymentBody(
  paymentProfile: PaymentProfile | undefined,
  promoCode: string | undefined,
): CardPaymentBody | null {
  if (
    !paymentProfile?.card_number ||
    !paymentProfile.cardholder_name ||
    !paymentProfile.expiry_month ||
    !paymentProfile.expiry_year ||
    !paymentProfile.cvv
  ) {
    return null
  }

  return {
    card_number: paymentProfile.card_number,
    cardholder_name: paymentProfile.cardholder_name,
    expiry_month: paymentProfile.expiry_month,
    expiry_year: paymentProfile.expiry_year,
    cvv: paymentProfile.cvv,
    promo_code: promoCode?.trim() || undefined,
  }
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
  const paymentBody = getPaymentBody(paymentProfileQuery.data, promoCode)
  const dataLoading = bookQuery.isLoading || paymentProfileQuery.isLoading
  const dataError = bookQuery.isError || paymentProfileQuery.isError
  const canPay =
    Boolean(book) &&
    Boolean(paymentBody) &&
    !dataLoading &&
    !dataError &&
    !purchaseBook.isPending

  const handlePurchase = async () => {
    if (!paymentBody) {
      return
    }

    await purchaseBook.mutateAsync(paymentBody)
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
            Покупка книги{book ? ` "${book.title}"` : ''}
          </h2>

          {dataLoading ? (
            <div className={styles.modalState}>
              <Spinner />
            </div>
          ) : book ? (
            <img
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
            <strong>{formatRubles(book?.sale_price)}</strong>
          </div>

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

          {!paymentBody && !paymentProfileQuery.isLoading && (
            <p className={styles.modalError}>
              Заполните данные карты в профиле.
            </p>
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
