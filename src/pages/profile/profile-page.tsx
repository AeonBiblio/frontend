import { Suspense, lazy, useState } from 'react'

import { AuthorCouponsCard } from '@modules/profile/ui/author-coupons-card'
import { BalanceCard } from '@modules/profile/ui/balance-card'
import { ChangeFieldCard } from '@modules/profile/ui/change-field-card'
import { ProfileCard } from '@modules/profile/ui/profile-card'
import { SubscriptionCard } from '@modules/profile/ui/subscription-card'
import styles from './profile-page.module.scss'

import type { ProfileEditableField } from '@modules/profile/ui/profile-card'

const PaymentCardModal = lazy(() =>
  import('@modules/profile/ui/payment-card-modal').then((module) => ({
    default: module.PaymentCardModal,
  })),
)

const defaultEditField: ProfileEditableField = {
  id: 'email',
  label: 'Почта',
  value: 'myexampleemail@gmail.com',
}

export function ProfilePage() {
  const [editField, setEditField] =
    useState<ProfileEditableField>(defaultEditField)
  const [paymentCardOpen, setPaymentCardOpen] = useState(false)

  const handleEditField = (field: ProfileEditableField) => {
    if (field.id === 'card') {
      setPaymentCardOpen(true)
      return
    }

    setEditField(field)
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageContent}>
        <h1 className={styles.pageTitle}>Настройки</h1>
        <div className={styles.pageContentBody}>
          <div className={styles.pageContentBodyUp}>
            <ProfileCard color="#f5f6ff" onEditField={handleEditField} />
            <ChangeFieldCard
              color="#f5f6ff"
              currentValue={editField.value}
              fieldLabel={editField.label}
              nextValue={editField.value}
            />
          </div>
          <div className={styles.pageContentBodyDown}>
            <div className={styles.pageContentBodyDownBalance}>
              <BalanceCard color="#f5f6ff" />
            </div>
            <div className={styles.pageContentBodyDownSubscription}>
              <SubscriptionCard color="#fff7eb" status="active" />
            </div>
          </div>
          <AuthorCouponsCard />
        </div>
      </div>
      {paymentCardOpen && (
        <Suspense fallback={null}>
          <PaymentCardModal
            open={paymentCardOpen}
            onClose={() => setPaymentCardOpen(false)}
          />
        </Suspense>
      )}
    </div>
  )
}
