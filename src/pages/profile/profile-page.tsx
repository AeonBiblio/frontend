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
  getCardLastDigits,
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
import { getAvatarSrc } from '@shared/lib/get-avatar-src'
import { PayoutModal } from './components/payout-modal'
import { ProfileBillingSection } from './components/profile-billing-section'
import { ProfileRoleContent } from './components/profile-role-content'
import { ProfileSettingsSection } from './components/profile-settings-section'
import {
  formatSubscriptionNextPaymentLabel,
  formatUserName,
} from './lib/profile-formatters'

import styles from './profile-page.module.scss'

import type { ProfileEditableField } from '@modules/profile/ui/profile-card'
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
  const cardLastDigits = getCardLastDigits(paymentProfileQuery.data) ?? '0000'

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
          <ProfileSettingsSection
            avatarSrc={avatarSrc}
            cardLastDigits={cardLastDigits}
            email={profile.email}
            fieldError={fieldError}
            fieldMessage={fieldMessage}
            onAvatarFile={handleAvatarFileProp}
            onEditField={handleEditField}
            onFieldSubmit={handleFieldSubmit}
            selectedField={selectedField}
            userName={userName}
          />

          <ProfileBillingSection
            availableAmount={balanceQuery.data?.availableAmount}
            cancelDisabled={cancelSubscription.isPending}
            isAuthor={isAuthor}
            nextPaymentLabel={subscriptionNextPaymentLabel}
            onCancelSubscription={handleCancelSubscriptionProp}
            onPayoutOpen={handlePayoutOpen}
            onSubscribeOpen={handleSubscribeOpen}
            payoutDisabled={createPayout.isPending}
            subscriptionLoading={subscriptionQuery.isLoading}
            subscriptionStatus={subscriptionQuery.data?.status}
          />

          <ProfileRoleContent
            authorBookStats={earningsBookStatsQuery.data}
            authorPromoCodes={authorPromoCodesQuery.data}
            authorPayouts={earningsPayoutsQuery.data}
            authorTransactions={earningsTransactionsQuery.data}
            earningsLoading={earningsStatsQuery.isLoading}
            earningsStats={earningsStatsQuery.data}
            isAuthor={isAuthor}
            readerPromoCode={readerPromoCode}
            readerPromoCodes={readerPromoCodesQuery.data}
            readerPromoCodesLoading={readerPromoCodesQuery.isLoading}
            onReaderPromoCodeChange={setReaderPromoCode}
            onReaderPromoSubmit={handleSubscribeOpen}
          />
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
