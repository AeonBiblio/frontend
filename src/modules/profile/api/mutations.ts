import { useMutation, useQueryClient } from '@tanstack/react-query'

import { authKeys, useSessionQuery } from '@shared/api/auth'
import {
  cardPaymentBodySchema,
  useAuthedMutation,
  uploadUrlOutSchema,
  updateUserBodySchema,
  userOutSchema,
} from '@shared/api/core'
import type { UpdateUserBody } from '@shared/api/core'
import { useApiClient } from '@shared/api/runtimeConfig/provider/provider'
import { db, userOutToLocalUserProfile } from '@shared/lib/db'
import type { LocalPaymentProfile, LocalUserProfile } from '@shared/lib/db'
import { putFileToPresignedUrl } from '@modules/books/api/upload-to-presigned'

import {
  cachedAt,
  getLocalPaymentProfile,
  getPaymentProfileLastDigits,
  paymentProfileSchema,
  profileKeys,
} from './common'
import type {
  PaymentProfileBody,
  PayoutBody,
  UpdatePasswordBody,
} from './common'

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()

  return useAuthedMutation<unknown, UpdateUserBody>('/users/me', 'patch', {
    onMutate: (body) => {
      updateUserBodySchema.parse(body)
    },
    onSuccess: async (data) => {
      const user = userOutToLocalUserProfile(userOutSchema.parse(data))

      await db.userProfiles.put(user)
      queryClient.setQueryData(
        authKeys.session(),
        (await db.userProfiles.get(user.id)) ?? user,
      )
      queryClient.setQueryData(
        profileKeys.me,
        (await db.userProfiles.get(user.id)) ?? user,
      )
    },
  })
}

export function useUpdatePasswordMutation() {
  return useAuthedMutation<unknown, UpdatePasswordBody>(
    '/users/me/password',
    'patch',
  )
}

export function useUpdatePaymentProfileMutation() {
  const queryClient = useQueryClient()
  const session = useSessionQuery()
  const userId = session.data?.id

  return useAuthedMutation<unknown, PaymentProfileBody>(
    '/users/me/payment-profile',
    'patch',
    {
      onMutate: (body) => {
        cardPaymentBodySchema.omit({ promo_code: true }).parse(body)
      },
      onSuccess: async (data, body) => {
        if (!userId) {
          return
        }

        const profile = paymentProfileSchema.parse(data)
        const lastDigits =
          getPaymentProfileLastDigits(profile) ?? body.card_number.slice(-4)
        const localProfile: LocalPaymentProfile = {
          userId,
          card_last_digits: lastDigits,
          card_last4: lastDigits,
          cachedAt: cachedAt(),
        }

        await db.paymentProfiles.put(localProfile)

        queryClient.setQueryData(
          profileKeys.paymentProfile,
          (await getLocalPaymentProfile(userId)) ?? localProfile,
        )
      },
    },
  )
}

export function useUpdateAvatarMutation() {
  const client = useApiClient()
  const queryClient = useQueryClient()

  return useMutation<LocalUserProfile, unknown, File>({
    mutationFn: async (file) => {
      const uploadResponse = await client.post('/users/me/avatar')
      const upload = uploadUrlOutSchema.parse(uploadResponse.data)

      await putFileToPresignedUrl(file, upload.upload_url)

      const response = await client.patch('/users/me/avatar-key', null, {
        params: { object_key: upload.object_key },
      })
      const user = userOutToLocalUserProfile(userOutSchema.parse(response.data))

      await db.userProfiles.put(user)

      return (await db.userProfiles.get(user.id)) ?? user
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.session(), user)
      queryClient.setQueryData(profileKeys.me, user)
    },
  })
}

export function useCancelSubscriptionMutation() {
  return useAuthedMutation<unknown, void>('/subscriptions/me/cancel', 'post', {
    invalidate: profileKeys.subscription,
  })
}

export function useCreatePayoutMutation() {
  const queryClient = useQueryClient()

  return useAuthedMutation<unknown, PayoutBody>('/earnings/payouts', 'post', {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: profileKeys.balance,
      })
      await queryClient.invalidateQueries({
        queryKey: profileKeys.earningsPayouts,
      })
      await queryClient.invalidateQueries({
        queryKey: profileKeys.earningsTransactions,
      })
    },
  })
}
