import type { BookFormat } from '@shared/api/core'

const rubleFormatter = new Intl.NumberFormat('ru-RU')

export function formatRubles(value: string | null | undefined) {
  if (!value) {
    return 'Не продается'
  }

  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return `${value} ₽`
  }

  return `${rubleFormatter.format(amount)} ₽`
}

export function getAuthorLabel(book: {
  author_id: string
  author_display_name?: string | null
  author_name?: string | null
  author_username?: string | null
}) {
  return (
    book.author_display_name?.trim() ||
    book.author_name?.trim() ||
    book.author_username?.trim() ||
    `Автор ${book.author_id.slice(0, 8)}`
  )
}

export function isPurchasedAccess(access: {
  source?: string | null
  reason?: string | null
}) {
  if (access.source === 'purchase') {
    return true
  }

  const reason = access.reason?.toLowerCase()

  return Boolean(
    reason?.includes('purchase') ||
    reason?.includes('purchased') ||
    reason?.includes('куп'),
  )
}

export function getReadLabel(
  canRead: boolean | undefined,
  inSubscription: boolean,
  accessLoading: boolean,
) {
  if (accessLoading) {
    return 'Проверяем доступ'
  }

  if (canRead) {
    return 'Читать'
  }

  return inSubscription ? 'Читать по подписке' : 'Нет доступа'
}

export function hasSubscriptionPayout(value: string | null | undefined) {
  return Number(value ?? 0) > 0
}

export function getDownloadFileName(title: string, format: BookFormat) {
  const forbiddenChars = '<>:"/\\|?*'
  const safeTitle = [...title.trim()]
    .filter(
      (char) => char.charCodeAt(0) >= 32 && !forbiddenChars.includes(char),
    )
    .join('')
    .replace(/\s+/g, ' ')

  return `${safeTitle || 'book'}.${format}`
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function getBookMetaDescription(
  title: string | undefined,
  description: string | null | undefined,
) {
  const trimmedDescription = description?.trim()

  if (trimmedDescription) {
    return trimmedDescription
  }

  return title
    ? `${title} — книга в каталоге AeonBiblio.`
    : 'Страница книги в AeonBiblio.'
}
