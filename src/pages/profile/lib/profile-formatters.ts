const amountFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('ru-RU')

export function formatUserName(username?: string, displayTag?: string | null) {
  if (!username) {
    return ''
  }

  return displayTag ? `${username} ${displayTag}` : username
}

export function formatAmount(amount?: string | null) {
  if (!amount) {
    return '0,00'
  }

  const numericAmount = Number(amount)

  if (!Number.isFinite(numericAmount)) {
    return amount.replace('.', ',')
  }

  return amountFormatter.format(numericAmount)
}

export function getSubscriptionStatus(status?: string) {
  return status === 'active' ? 'active' : 'inactive'
}

export function formatSubscriptionNextPaymentLabel(expiresAt?: string | null) {
  if (!expiresAt) {
    return undefined
  }

  const date = new Date(expiresAt)

  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  return `Активна до ${dateFormatter.format(date)}`
}
