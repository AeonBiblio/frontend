import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  usePaymentProfileQuery,
  useUpdatePaymentProfileMutation,
} from '@modules/profile/api'
import { Spinner } from '@shared/ui/spinner/spinner'

import styles from './payment-card-modal.module.scss'

const paymentCardSchema = z.object({
  card_number: z.string().regex(/^\d{12,19}$/),
  cardholder_name: z.string().min(1),
  expiry_month: z.string().regex(/^(0?[1-9]|1[0-2])$/),
  expiry_year: z
    .string()
    .regex(/^\d{4}$/)
    .refine((year) => Number(year) >= 2026),
  cvv: z.string().regex(/^\d{3,4}$/),
})

type PaymentCardFormValues = z.infer<typeof paymentCardSchema>

type PaymentCardModalProps = {
  open: boolean
  onClose: () => void
}

export function PaymentCardModal({ open, onClose }: PaymentCardModalProps) {
  const paymentProfileQuery = usePaymentProfileQuery({ enabled: open })
  const updatePaymentProfile = useUpdatePaymentProfileMutation()
  const form = useForm<PaymentCardFormValues>({
    resolver: zodResolver(paymentCardSchema),
    mode: 'onChange',
    defaultValues: {
      card_number: '',
      cardholder_name: '',
      expiry_month: '',
      expiry_year: '',
      cvv: '',
    },
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset({
      card_number: '',
      cardholder_name: '',
      expiry_month: '',
      expiry_year: '',
      cvv: '',
    })
  }, [form, open, paymentProfileQuery.data])

  if (!open) {
    return null
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    await updatePaymentProfile.mutateAsync({
      card_number: values.card_number,
      cardholder_name: values.cardholder_name,
      expiry_month: Number(values.expiry_month),
      expiry_year: Number(values.expiry_year),
      cvv: values.cvv,
    })
    onClose()
  })

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-card-title"
      >
        <button className={styles.modalClose} type="button" onClick={onClose}>
          <X aria-hidden="true" size={20} strokeWidth={2} />
        </button>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <h2 className={styles.modalTitle} id="payment-card-title">
            Данные карты
          </h2>

          {paymentProfileQuery.isLoading ? (
            <div className={styles.modalState}>
              <Spinner />
            </div>
          ) : (
            <>
              <label className={styles.modalField}>
                <span>Номер карты</span>
                <input
                  className={styles.modalInput}
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="4111111111111111"
                  aria-invalid={Boolean(form.formState.errors.card_number)}
                  {...form.register('card_number')}
                />
              </label>

              <label className={styles.modalField}>
                <span>Имя держателя</span>
                <input
                  className={styles.modalInput}
                  autoComplete="cc-name"
                  placeholder="TEST USER"
                  aria-invalid={Boolean(form.formState.errors.cardholder_name)}
                  {...form.register('cardholder_name')}
                />
              </label>

              <div className={styles.modalRow}>
                <label className={styles.modalField}>
                  <span>Месяц</span>
                  <input
                    className={styles.modalInput}
                    inputMode="numeric"
                    autoComplete="cc-exp-month"
                    placeholder="12"
                    aria-invalid={Boolean(form.formState.errors.expiry_month)}
                    {...form.register('expiry_month')}
                  />
                </label>

                <label className={styles.modalField}>
                  <span>Год</span>
                  <input
                    className={styles.modalInput}
                    inputMode="numeric"
                    autoComplete="cc-exp-year"
                    placeholder="2030"
                    aria-invalid={Boolean(form.formState.errors.expiry_year)}
                    {...form.register('expiry_year')}
                  />
                </label>

                <label className={styles.modalField}>
                  <span>CVV</span>
                  <input
                    className={styles.modalInput}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                    aria-invalid={Boolean(form.formState.errors.cvv)}
                    {...form.register('cvv')}
                  />
                </label>
              </div>
            </>
          )}

          {(paymentProfileQuery.isError || updatePaymentProfile.isError) && (
            <p className={styles.modalError}>
              Не удалось сохранить данные карты.
            </p>
          )}

          <div className={styles.modalActions}>
            <button
              className={styles.modalSave}
              type="submit"
              disabled={
                paymentProfileQuery.isLoading ||
                !form.formState.isValid ||
                updatePaymentProfile.isPending
              }
            >
              {updatePaymentProfile.isPending ? <Spinner /> : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
