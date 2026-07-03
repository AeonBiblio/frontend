import { memo, useMemo } from 'react'

import styles from '../profile-page.module.scss'

import type {
  EarningsBookStats,
  EarningsStats,
  EarningsTransaction,
  PayoutOut,
} from '@shared/api/core'

type AuthorStatsSectionProps = {
  bookStats: EarningsBookStats[]
  isLoading: boolean
  payouts: PayoutOut[]
  stats: EarningsStats | undefined
  transactions: EarningsTransaction[]
}

const MAX_ROWS = 5

const moneyFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('ru-RU')

function formatAmount(amount?: string | null) {
  if (!amount) {
    return '0,00'
  }

  const numericAmount = Number(amount)

  if (Number.isNaN(numericAmount)) {
    return amount.replace('.', ',')
  }

  return moneyFormatter.format(numericAmount)
}

function formatMoney(amount?: string | null) {
  return `${formatAmount(amount)} ₽`
}

function formatDate(value?: string | null) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return dateFormatter.format(date)
}

export const AuthorStatsSection = memo(function AuthorStatsSectionView({
  bookStats,
  isLoading,
  payouts,
  stats,
  transactions,
}: AuthorStatsSectionProps) {
  const metrics = useMemo(
    () => [
      {
        label: 'Прочтения',
        value: stats?.total_reads ?? 0,
      },
      {
        label: 'Продажи',
        value: stats?.total_sales ?? 0,
      },
      {
        label: 'Заработано',
        value: formatMoney(stats?.total_earned),
      },
      {
        label: 'В ожидании',
        value: formatMoney(stats?.pending_amount),
      },
    ],
    [
      stats?.pending_amount,
      stats?.total_earned,
      stats?.total_reads,
      stats?.total_sales,
    ],
  )

  const bookRows = useMemo(
    () =>
      bookStats.slice(0, MAX_ROWS).map((book) => ({
        id: book.book_id,
        title: book.title,
        meta: `${book.reads} прочт. · ${book.sales} прод.`,
        amount: formatMoney(book.income),
      })),
    [bookStats],
  )

  const payoutRows = useMemo(
    () =>
      payouts.slice(0, MAX_ROWS).map((payout) => ({
        id: payout.id,
        title: payout.status,
        meta: formatDate(payout.created_at),
        amount: formatMoney(payout.amount),
      })),
    [payouts],
  )

  const transactionRows = useMemo(
    () =>
      transactions.slice(0, MAX_ROWS).map((transaction) => ({
        id: transaction.id,
        title: transaction.description ?? transaction.type,
        meta: formatDate(transaction.created_at),
        amount: formatMoney(transaction.amount),
      })),
    [transactions],
  )

  return (
    <section className={styles.authorStats}>
      <div className={styles.authorStatsHeader}>
        <h2 className={styles.authorStatsTitle}>Статистика автора</h2>
        <span className={styles.authorStatsMeta}>
          {isLoading ? 'Загрузка' : 'За всё время'}
        </span>
      </div>

      <div className={styles.authorStatsGrid}>
        {metrics.map((metric) => (
          <div className={styles.authorMetric} key={metric.label}>
            <span className={styles.authorMetricLabel}>{metric.label}</span>
            <strong className={styles.authorMetricValue}>{metric.value}</strong>
          </div>
        ))}
      </div>

      <div className={styles.authorStatsColumns}>
        <AuthorRowsPanel
          title="Книги"
          rows={bookRows}
          emptyText="Данных по книгам нет"
        />

        <AuthorRowsPanel
          title="Выплаты"
          rows={payoutRows}
          emptyText="Выплат пока нет"
        />

        <AuthorRowsPanel
          title="Транзакции"
          rows={transactionRows}
          emptyText="Транзакций пока нет"
        />
      </div>
    </section>
  )
})

type AuthorRow = {
  id: string
  title: string
  meta: string
  amount: string
}

type AuthorRowsPanelProps = {
  title: string
  rows: AuthorRow[]
  emptyText: string
}

const AuthorRowsPanel = memo(function AuthorRowsPanelView({
  title,
  rows,
  emptyText,
}: AuthorRowsPanelProps) {
  return (
    <div className={styles.authorStatsPanel}>
      <h3 className={styles.authorStatsSubtitle}>{title}</h3>

      {rows.length > 0 ? (
        <div className={styles.authorRows}>
          {rows.map((row) => (
            <div className={styles.authorRow} key={row.id}>
              <span className={styles.authorRowTitle}>{row.title}</span>
              <span className={styles.authorRowMeta}>{row.meta}</span>
              <strong className={styles.authorRowAmount}>{row.amount}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.authorEmpty}>{emptyText}</p>
      )}
    </div>
  )
})
