import { AuthorCouponsCard } from '@modules/profile/ui/author-coupons-card'
import { PromoCodeInputCard } from '@modules/profile/ui/promo-code-input-card'
import { AuthorStatsSection } from './author-stats-section'
import { ReaderPromoCodesSection } from './reader-promo-codes-section'

import type {
  EarningsBookStats,
  EarningsStats,
  EarningsTransaction,
  PayoutOut,
} from '@shared/api/core'
import type { LocalPromoCode } from '@shared/lib/db'

type ProfileRoleContentProps = {
  authorBookStats: EarningsBookStats[] | undefined
  authorPromoCodes: LocalPromoCode[] | undefined
  authorPayouts: PayoutOut[] | undefined
  authorTransactions: EarningsTransaction[] | undefined
  earningsLoading: boolean
  earningsStats: EarningsStats | undefined
  isAuthor: boolean
  readerPromoCode: string
  readerPromoCodes: LocalPromoCode[] | undefined
  readerPromoCodesLoading: boolean
  onReaderPromoCodeChange: (value: string) => void
  onReaderPromoSubmit: () => void
}

const EMPTY_BOOK_STATS: EarningsBookStats[] = []
const EMPTY_PAYOUTS: PayoutOut[] = []
const EMPTY_TRANSACTIONS: EarningsTransaction[] = []
const EMPTY_PROMO_CODES: LocalPromoCode[] = []

export function ProfileRoleContent({
  authorBookStats,
  authorPromoCodes,
  authorPayouts,
  authorTransactions,
  earningsLoading,
  earningsStats,
  isAuthor,
  readerPromoCode,
  readerPromoCodes,
  readerPromoCodesLoading,
  onReaderPromoCodeChange,
  onReaderPromoSubmit,
}: ProfileRoleContentProps) {
  if (isAuthor) {
    return (
      <>
        <AuthorStatsSection
          bookStats={authorBookStats ?? EMPTY_BOOK_STATS}
          isLoading={earningsLoading}
          payouts={authorPayouts ?? EMPTY_PAYOUTS}
          stats={earningsStats}
          transactions={authorTransactions ?? EMPTY_TRANSACTIONS}
        />

        <AuthorCouponsCard
          issueCoupons={authorPromoCodes?.length ?? 0}
          promoCode={authorPromoCodes?.[0]?.code ?? 'Нет выданных купонов'}
        />
      </>
    )
  }

  return (
    <>
      <PromoCodeInputCard
        value={readerPromoCode}
        onChange={onReaderPromoCodeChange}
        onSubmit={onReaderPromoSubmit}
      />

      <ReaderPromoCodesSection
        isLoading={readerPromoCodesLoading}
        promoCodes={readerPromoCodes ?? EMPTY_PROMO_CODES}
        onSelect={onReaderPromoCodeChange}
      />
    </>
  )
}
