import { BalanceCard } from '@modules/profile/ui/balance-card'
import { SubscriptionCard } from '@modules/profile/ui/subscription-card'

import {
  formatAmount,
  getSubscriptionStatus,
} from '@domain/profile/profile-formatters'
import styles from '../profile-page.module.scss'

type ProfileBillingSectionProps = {
  availableAmount: string | null | undefined
  cancelDisabled: boolean
  isAuthor: boolean
  nextPaymentLabel: string | undefined
  onCancelSubscription: () => void
  onPayoutOpen: () => void
  onSubscribeOpen: () => void
  payoutDisabled: boolean
  subscriptionLoading: boolean
  subscriptionStatus: string | undefined
}

export function ProfileBillingSection({
  availableAmount,
  cancelDisabled,
  isAuthor,
  nextPaymentLabel,
  onCancelSubscription,
  onPayoutOpen,
  onSubscribeOpen,
  payoutDisabled,
  subscriptionLoading,
  subscriptionStatus,
}: ProfileBillingSectionProps) {
  return (
    <div className={styles.pageContentBodyDown}>
      {isAuthor && (
        <div className={styles.pageContentBodyDownBalance}>
          <BalanceCard
            actionLabel="Вывести"
            amount={formatAmount(availableAmount)}
            color="#f5f6ff"
            disabled={payoutDisabled}
            label="БАЛАНС"
            onAction={onPayoutOpen}
          />
        </div>
      )}

      <div className={styles.pageContentBodyDownSubscription}>
        <SubscriptionCard
          color="#fff7eb"
          disabled={cancelDisabled || subscriptionLoading}
          nextPaymentLabel={nextPaymentLabel}
          onCancelClick={onCancelSubscription}
          onPayNowClick={onSubscribeOpen}
          onSubscribeClick={onSubscribeOpen}
          status={getSubscriptionStatus(subscriptionStatus)}
        />
      </div>
    </div>
  )
}
