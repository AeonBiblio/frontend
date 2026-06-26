import { useSubscriptionMeQuery } from '@modules/library/api'

import styles from './subscription-status-badge.module.scss'

export function SubscriptionStatusBadge() {
  const subscriptionQuery = useSubscriptionMeQuery()

  if (subscriptionQuery.isLoading) {
    return null
  }

  if (subscriptionQuery.data?.status !== 'active') {
    return null
  }

  return <p className={styles.badge}>Подписка активна</p>
}
