import { useAuthedMutation, useAuthedQuery } from '@shared/api/core'

import type { CardPaymentBody } from '@shared/api/core'

export type PaymentProfile = Partial<Omit<CardPaymentBody, 'promo_code'>> & {
  card_last_digits?: string | null
  card_last4?: string | null
}

export type PaymentProfileBody = Omit<CardPaymentBody, 'promo_code'>

export const profileKeys = {
  paymentProfile: ['profile', 'payment-profile'] as const,
}

export function usePaymentProfileQuery({
  enabled = true,
}: { enabled?: boolean } = {}) {
  return useAuthedQuery<PaymentProfile>({
    key: profileKeys.paymentProfile,
    path: '/users/me/payment-profile',
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdatePaymentProfileMutation() {
  return useAuthedMutation<PaymentProfile, PaymentProfileBody>(
    '/users/me/payment-profile',
    'patch',
    {
      invalidate: profileKeys.paymentProfile,
    },
  )
}
