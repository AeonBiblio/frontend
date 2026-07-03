import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Helmet } from 'react-helmet-async'

import {
  useAuthorPromoCodesQuery,
  useCancelSubscriptionMutation,
  useCreatePayoutMutation,
  useEarningsBalanceQuery,
  useEarningsBookStatsQuery,
  useEarningsPayoutsQuery,
  useEarningsStatsQuery,
  useEarningsTransactionsQuery,
  usePaymentProfileQuery,
  useProfilePromoCodesQuery,
  useProfileQuery,
  useProfileSubscriptionQuery,
  useUpdateAvatarMutation,
  useUpdateProfileMutation,
} from '@modules/profile/api'
import { AuthorCouponsCard } from '@modules/profile/ui/author-coupons-card'
import { BalanceCard } from '@modules/profile/ui/balance-card'
import { ChangeFieldCard } from '@modules/profile/ui/change-field-card'
import { PromoCodeInputCard } from '@modules/profile/ui/promo-code-input-card'
import { ProfileCard } from '@modules/profile/ui/profile-card'
import { SubscriptionCard } from '@modules/profile/ui/subscription-card'
import { getAvatarSrc } from '@shared/lib/get-avatar-src'
import { AuthorStatsSection } from './components/author-stats-section'
import { PayoutModal } from './components/payout-modal'
import { ReaderPromoCodesSection } from './components/reader-promo-codes-section'

import styles from './profile-page.module.scss'

import type { ProfileEditableField } from '@modules/profile/ui/profile-card'
import type {
  EarningsBookStats,
  EarningsTransaction,
  PayoutOut,
} from '@shared/api/core'
import { FullPageSpinner } from '#/shared/ui/fullPageSpinner/fullPageSpinner'

const PaymentCardModal = lazy(() =>
  import('@modules/profile/ui/payment-card-modal').then((module) => ({
    default: module.PaymentCardModal,
  })),
)

const SubscribeModal = lazy(() =>
  import('@modules/subscription').then((module) => ({
    default: module.SubscribeModal,
  })),
)

const defaultEditField: ProfileEditableField = {
  id: 'name',
  label: 'Имя',
  value: '',
}

const EMPTY_BOOK_STATS: EarningsBookStats[] = []
const EMPTY_PAYOUTS: PayoutOut[] = []
const EMPTY_TRANSACTIONS: EarningsTransaction[] = []

const amountFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('ru-RU')

function formatUserName(username?: string, displayTag?: string | null) {
  if (!username) {
    return ''
  }

  return displayTag ? `${username} ${displayTag}` : username
}

function formatAmount(amount?: string | null) {
  if (!amount) {
    return '0,00'
  }

  const numericAmount = Number(amount)

  if (!Number.isFinite(numericAmount)) {
    return amount.replace('.', ',')
  }

  return amountFormatter.format(numericAmount)
}

function getSubscriptionStatus(status?: string) {
  return status === 'active' ? 'active' : 'inactive'
}

function formatSubscriptionNextPaymentLabel(expiresAt?: string | null) {
  if (!expiresAt) {
    return undefined
  }

  const date = new Date(expiresAt)

  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  return `Активна до ${dateFormatter.format(date)}`
}

export function ProfilePage() {
  const [editField, setEditField] =
    useState<ProfileEditableField>(defaultEditField)
  const [paymentCardOpen, setPaymentCardOpen] = useState(false)
  const [payoutOpen, setPayoutOpen] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [readerPromoCode, setReaderPromoCode] = useState('')
  const [subscribeOpen, setSubscribeOpen] = useState(false)
  const [fieldMessage, setFieldMessage] = useState<string>()
  const [fieldError, setFieldError] = useState<string>()
  const [avatarPreview, setAvatarPreview] = useState<string>()

  const profileQuery = useProfileQuery()
  const profile = profileQuery.data

  const isProfileReady = Boolean(profile)
  const isAuthor = profile?.role === 'author'
  const isReader = profile?.role === 'reader'

  const paymentProfileQuery = usePaymentProfileQuery({
    enabled: isProfileReady,
  })

  const subscriptionQuery = useProfileSubscriptionQuery({
    enabled: isProfileReady,
  })

  const balanceQuery = useEarningsBalanceQuery({
    enabled: isAuthor,
  })

  const earningsStatsQuery = useEarningsStatsQuery({
    enabled: isAuthor,
  })

  const earningsBookStatsQuery = useEarningsBookStatsQuery({
    enabled: isAuthor,
  })

  const earningsPayoutsQuery = useEarningsPayoutsQuery({
    enabled: isAuthor,
  })

  const earningsTransactionsQuery = useEarningsTransactionsQuery({
    enabled: isAuthor,
  })

  const authorPromoCodesQuery = useAuthorPromoCodesQuery({
    enabled: isAuthor,
  })

  const readerPromoCodesQuery = useProfilePromoCodesQuery({
    enabled: isReader,
  })

  const updateProfile = useUpdateProfileMutation()
  const updateAvatar = useUpdateAvatarMutation()
  const cancelSubscription = useCancelSubscriptionMutation()
  const createPayout = useCreatePayoutMutation()

  useEffect(() => {
    if (!avatarPreview?.startsWith('blob:')) {
      return
    }

    return () => URL.revokeObjectURL(avatarPreview)
  }, [avatarPreview])

  const userName = useMemo(
    () => formatUserName(profile?.username, profile?.displayTag),
    [profile?.displayTag, profile?.username],
  )

  const profileTitle = userName ? `Профиль - ${userName}` : 'Профиль'

  const avatarSrc = useMemo(
    () => avatarPreview ?? getAvatarSrc(profile?.avatarKey, profile?.avatarUrl),
    [avatarPreview, profile?.avatarKey, profile?.avatarUrl],
  )

  const selectedField = useMemo<ProfileEditableField>(() => {
    if (editField.value) {
      return editField
    }

    return {
      ...editField,
      value: userName,
    }
  }, [editField, userName])

  const subscriptionNextPaymentLabel = useMemo(
    () => formatSubscriptionNextPaymentLabel(subscriptionQuery.data?.expiresAt),
    [subscriptionQuery.data?.expiresAt],
  )

  const issueCoupons = authorPromoCodesQuery.data?.length ?? 0

  const authorBookStats = earningsBookStatsQuery.data ?? EMPTY_BOOK_STATS
  const authorPayouts = earningsPayoutsQuery.data ?? EMPTY_PAYOUTS
  const authorTransactions =
    earningsTransactionsQuery.data ?? EMPTY_TRANSACTIONS

  const clearFieldStatus = useCallback(() => {
    setFieldError(undefined)
    setFieldMessage(undefined)
  }, [])

  const handleEditField = useCallback(
    (field: ProfileEditableField) => {
      clearFieldStatus()

      if (field.id === 'card') {
        setPaymentCardOpen(true)
        return
      }

      setEditField(field)
    },
    [clearFieldStatus],
  )

  const handleFieldSubmit = useCallback(
    async ({ nextValue }: { nextValue: string }) => {
      clearFieldStatus()

      try {
        if (selectedField.id === 'name') {
          await updateProfile.mutateAsync({ username: nextValue })
          setFieldMessage('Данные профиля сохранены.')
          return
        }

        setFieldError('Это поле нельзя изменить через текущий API.')
      } catch {
        setFieldError('Не удалось сохранить изменения.')
      }
    },
    [clearFieldStatus, selectedField.id, updateProfile],
  )

  const handleAvatarFile = useCallback(
    async (file: File) => {
      clearFieldStatus()

      const previewUrl = URL.createObjectURL(file)
      setAvatarPreview(previewUrl)

      try {
        await updateAvatar.mutateAsync(file)
        setFieldMessage('Аватар сохранён.')
      } catch {
        setFieldError('Не удалось сохранить аватар.')
      }
    },
    [clearFieldStatus, updateAvatar],
  )

  const handleCancelSubscription = useCallback(async () => {
    clearFieldStatus()

    try {
      await cancelSubscription.mutateAsync()
      setFieldMessage('Подписка отменена.')
    } catch {
      setFieldError('Не удалось отменить подписку.')
    }
  }, [cancelSubscription, clearFieldStatus])

  const handlePayout = useCallback(async () => {
    const amount = payoutAmount.trim().replace(',', '.')

    if (!amount) {
      return
    }

    clearFieldStatus()

    try {
      await createPayout.mutateAsync({ amount })
      setPayoutOpen(false)
      setPayoutAmount('')
      setFieldMessage('Заявка на вывод средств отправлена.')
    } catch {
      setFieldError('Не удалось отправить заявку на вывод.')
    }
  }, [clearFieldStatus, createPayout, payoutAmount])

  const handlePayoutOpen = useCallback(() => {
    setPayoutOpen(true)
  }, [])

  const handlePayoutClose = useCallback(() => {
    setPayoutOpen(false)
  }, [])

  const handlePaymentCardClose = useCallback(() => {
    setPaymentCardOpen(false)
  }, [])

  const handleSubscribeOpen = useCallback(() => {
    setSubscribeOpen(true)
  }, [])

  const handleSubscribeClose = useCallback(() => {
    setSubscribeOpen(false)
  }, [])

  const handleAvatarFileProp = useCallback(
    (file: File) => {
      void handleAvatarFile(file)
    },
    [handleAvatarFile],
  )

  const handleCancelSubscriptionProp = useCallback(() => {
    void handleCancelSubscription()
  }, [handleCancelSubscription])

  const handlePayoutSubmitProp = useCallback(() => {
    void handlePayout()
  }, [handlePayout])

  if (profileQuery.isLoading || !profile) {
    return <FullPageSpinner />
  }

  return (
    <div className={styles.page}>
      <Helmet>
        <title>{profileTitle}</title>
        <meta
          name="description"
          content={
            userName
              ? `Профиль пользователя ${userName} в AeonBiblio.`
              : 'Профиль пользователя AeonBiblio.'
          }
        />
      </Helmet>

      <div className={styles.pageContent}>
        <h1 className={styles.pageTitle}>Настройки</h1>

        <div className={styles.pageContentBody}>
          <div className={styles.pageContentBodyUp}>
            <ProfileCard
              avatarSrc={avatarSrc}
              color="#f5f6ff"
              email={profile.email}
              name={userName}
              onAvatarFile={handleAvatarFileProp}
              onEditField={handleEditField}
            />

            <ChangeFieldCard
              color="#f5f6ff"
              currentValue={selectedField.value}
              fieldLabel={selectedField.label}
              nextValue={selectedField.value}
              onSubmit={handleFieldSubmit}
              submitError={fieldError}
              submitSuccess={fieldMessage}
            />
          </div>

          <div className={styles.pageContentBodyDown}>
            {isAuthor && (
              <div className={styles.pageContentBodyDownBalance}>
                <BalanceCard
                  actionLabel="Вывести"
                  amount={formatAmount(balanceQuery.data?.availableAmount)}
                  color="#f5f6ff"
                  disabled={createPayout.isPending}
                  label="БАЛАНС"
                  onAction={handlePayoutOpen}
                />
              </div>
            )}

            <div className={styles.pageContentBodyDownSubscription}>
              <SubscriptionCard
                color="#fff7eb"
                disabled={
                  cancelSubscription.isPending || subscriptionQuery.isLoading
                }
                nextPaymentLabel={subscriptionNextPaymentLabel}
                onCancelClick={handleCancelSubscriptionProp}
                onPayNowClick={handleSubscribeOpen}
                onSubscribeClick={handleSubscribeOpen}
                status={getSubscriptionStatus(subscriptionQuery.data?.status)}
              />
            </div>
          </div>

          {isAuthor ? (
            <>
              <AuthorStatsSection
                bookStats={authorBookStats}
                isLoading={earningsStatsQuery.isLoading}
                payouts={authorPayouts}
                stats={earningsStatsQuery.data}
                transactions={authorTransactions}
              />

              <AuthorCouponsCard
                issueCoupons={issueCoupons}
                promoCode={
                  authorPromoCodesQuery.data?.[0]?.code ??
                  'Нет выданных купонов'
                }
              />
            </>
          ) : (
            <>
              <PromoCodeInputCard
                value={readerPromoCode}
                onChange={setReaderPromoCode}
                onSubmit={handleSubscribeOpen}
              />

              <ReaderPromoCodesSection
                isLoading={readerPromoCodesQuery.isLoading}
                promoCodes={readerPromoCodesQuery.data ?? []}
                onSelect={setReaderPromoCode}
              />
            </>
          )}
        </div>
      </div>

      {payoutOpen && (
        <PayoutModal
          amount={payoutAmount}
          disabled={createPayout.isPending}
          onAmountChange={setPayoutAmount}
          onClose={handlePayoutClose}
          onSubmit={handlePayoutSubmitProp}
        />
      )}

      {paymentCardOpen && (
        <Suspense fallback={null}>
          <PaymentCardModal
            open={paymentCardOpen}
            onClose={handlePaymentCardClose}
          />
        </Suspense>
      )}

      {subscribeOpen && (
        <Suspense fallback={null}>
          <SubscribeModal
            initialPromoCode={readerPromoCode.trim()}
            paymentProfile={paymentProfileQuery.data}
            paymentProfileLoading={paymentProfileQuery.isLoading}
            onClose={handleSubscribeClose}
          />
        </Suspense>
      )}
    </div>
  )
}
