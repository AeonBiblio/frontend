import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  useSubscribeMutation,
  useSubscriptionPlansQuery,
} from '@modules/subscription/api'
import { Spinner } from '@shared/ui/spinner/spinner'

import styles from './subscribe-modal.module.scss'

import type { SubscriptionPlan } from '@shared/api/core'

const subscribeSchema = z.object({
  coupon: z.string().optional(),
})

type SubscribeFormValues = z.infer<typeof subscribeSchema>
type PlanKind = 'monthly' | 'annual'

type SubscribeModalProps = {
  open: boolean
  onClose: () => void
}

type PlanCard = {
  kind: PlanKind
  plan: SubscriptionPlan
  title: string
  price: string
  total: string
}

function planName(plan: SubscriptionPlan) {
  return plan.title ?? plan.name
}

function planPrice(plan: SubscriptionPlan) {
  return plan.price ?? plan.amount
}

function planMonthlyPrice(plan: SubscriptionPlan) {
  return plan.monthly_price ?? planPrice(plan)
}

function createPlanCard(
  kind: PlanKind,
  plan: SubscriptionPlan | undefined,
): PlanCard | null {
  if (!plan) {
    return null
  }

  const title = planName(plan)
  const price = planMonthlyPrice(plan)
  const total = planPrice(plan)

  if (!title || !price || !total) {
    return null
  }

  return {
    kind,
    plan,
    title,
    price,
    total,
  }
}

function formatRubles(value: string) {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return value
  }

  return `${amount.toLocaleString('ru-RU')} ₽`
}

function isAnnualPlan(plan: SubscriptionPlan) {
  const value = `${plan.name ?? ''} ${plan.title ?? ''} ${plan.period ?? ''} ${
    plan.duration ?? ''
  }`.toLowerCase()

  return plan.duration_months === 12 || value.includes('год')
}

function isMonthlyPlan(plan: SubscriptionPlan) {
  const value = `${plan.name ?? ''} ${plan.title ?? ''} ${plan.period ?? ''} ${
    plan.duration ?? ''
  }`.toLowerCase()

  return plan.duration_months === 1 || value.includes('мес')
}

export function SubscribeModal({ open, onClose }: SubscribeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanKind>('monthly')
  const [couponApplied, setCouponApplied] = useState(false)
  const plansQuery = useSubscriptionPlansQuery({ enabled: open })
  const subscribeMutation = useSubscribeMutation()
  const form = useForm<SubscribeFormValues>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: {
      coupon: '',
    },
  })

  if (!open) {
    return null
  }

  const plans = plansQuery.data ?? []
  const monthlyPlan = plans.find(isMonthlyPlan) ?? plans[0]
  const annualPlan = plans.find(isAnnualPlan) ?? plans[1]
  const cards: PlanCard[] = []
  const monthlyCard = createPlanCard('monthly', monthlyPlan)
  const annualCard = createPlanCard('annual', annualPlan)

  if (monthlyCard) {
    cards.push(monthlyCard)
  }

  if (annualCard) {
    cards.push(annualCard)
  }

  const activeCard = cards.find((card) => card.kind === selectedPlan)
  const plansError =
    plansQuery.isError || (plansQuery.isSuccess && cards.length === 0)
  const canPay =
    Boolean(activeCard) &&
    !plansError &&
    !plansQuery.isLoading &&
    !subscribeMutation.isPending

  const handleSubmit = form.handleSubmit(async ({ coupon }) => {
    if (!activeCard) {
      return
    }

    await subscribeMutation.mutateAsync({
      plan_id: activeCard.plan.id,
      promo_code: couponApplied && coupon?.trim() ? coupon.trim() : undefined,
    })
    onClose()
  })

  return (
    <div className={styles.modalOverlay} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscribe-title"
      >
        <button className={styles.modalClose} type="button" onClick={onClose}>
          <X aria-hidden="true" size={20} strokeWidth={2} />
        </button>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <h2 className={styles.modalTitle} id="subscribe-title">
            Оплата подписки
          </h2>

          <div className={styles.modalPlans} role="radiogroup">
            {cards.length > 0 ? (
              cards.map((card) => (
                <button
                  className={styles.modalPlan}
                  type="button"
                  aria-checked={selectedPlan === card.kind}
                  role="radio"
                  key={card.kind}
                  onClick={() => setSelectedPlan(card.kind)}
                >
                  <span className={styles.modalPlanTitle}>{card.title}</span>
                  <strong>{formatRubles(card.price)}/Мес.</strong>
                  <span>{card.total} руб.</span>
                </button>
              ))
            ) : plansQuery.isLoading ? (
              <p className={styles.modalInfo}>
                <Spinner />
              </p>
            ) : (
              <p className={styles.modalError}>
                Не удалось получить данные подписки.
              </p>
            )}
          </div>

          <div className={styles.modalCoupon}>
            <label className={styles.modalCouponLabel} htmlFor="coupon">
              Активировать купон
            </label>
            <div className={styles.modalCouponRow}>
              <input
                id="coupon"
                className={styles.modalInput}
                placeholder="Введите купон"
                {...form.register('coupon')}
              />
              <button
                className={styles.modalApplyButton}
                type="button"
                onClick={() => setCouponApplied(true)}
              >
                Применить
              </button>
            </div>
            {couponApplied && (
              <p className={styles.modalCouponSuccess}>
                Купон успешно применён !
              </p>
            )}
          </div>

          <div className={styles.modalTotal}>
            <span>Итого к оплате</span>
            <strong>{activeCard ? formatRubles(activeCard.total) : '-'}</strong>
          </div>

          <div className={styles.modalPay}>
            <button
              className={styles.modalPayButton}
              type="submit"
              disabled={!canPay}
            >
              {subscribeMutation.isPending ? <Spinner /> : 'Оплатить'}
            </button>
          </div>

          {subscribeMutation.isError && (
            <p className={styles.modalError}>
              Не удалось выполнить запрос. Проверьте данные и попробуйте снова.
            </p>
          )}

          <p className={styles.modalTerms}>
            Нажимая кнопку оплаты, вы принимаете условия{' '}
            <Link to=".">лицензионного договора</Link> и соглашаетесь с
            правилами приобретения подписки.
          </p>
        </form>
      </div>
    </div>
  )
}
