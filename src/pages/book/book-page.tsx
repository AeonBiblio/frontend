import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'

import {
  bookKeys,
  useBookAccessQuery,
  useBookGenreTagsQuery,
  useBookQuery,
  useBookRatingQuery,
  useDownloadBookFileMutation,
  usePutBookRatingMutation,
  useRecordBookReadMutation,
} from '@modules/books/api'
import { BookDetailsCard } from '@modules/books/ui'
import { useCreateReviewMutation } from '@modules/reviews/api'
import { useSessionQuery } from '@shared/api/auth'
import { getCoverSrc } from '@shared/lib/get-cover-src'
import { Spinner } from '@shared/ui/spinner/spinner'
import { BookDownloadSection } from './components/book-download-section'
import { BookFeedbackSections } from './components/book-feedback-sections'

import styles from './book-page.module.scss'

import type { ReviewFormSubmitPayload } from '@modules/reviews'
import type { BookFormat } from '@shared/api/core'

const bookRoute = getRouteApi('/books/$bookId')

const PurchaseBookModal = lazy(() =>
  import('@modules/books/ui').then((module) => ({
    default: module.PurchaseBookModal,
  })),
)

const SubscribeModal = lazy(() =>
  import('@modules/subscription').then((module) => ({
    default: module.SubscribeModal,
  })),
)

const rubleFormatter = new Intl.NumberFormat('ru-RU')

function formatRubles(value: string | null | undefined) {
  if (!value) {
    return 'Не продается'
  }

  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return `${value} ₽`
  }

  return `${rubleFormatter.format(amount)} ₽`
}

function getAuthorLabel(book: {
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

function isPurchasedAccess(access: {
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

function getReadLabel(
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

function hasSubscriptionPayout(value: string | null | undefined) {
  return Number(value ?? 0) > 0
}

function getDownloadFileName(title: string, format: BookFormat) {
  const forbiddenChars = '<>:"/\\|?*'
  const safeTitle = [...title.trim()]
    .filter(
      (char) => char.charCodeAt(0) >= 32 && !forbiddenChars.includes(char),
    )
    .join('')
    .replace(/\s+/g, ' ')

  return `${safeTitle || 'book'}.${format}`
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function getBookMetaDescription(
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

export function BookPage() {
  const { bookId } = bookRoute.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [subscribeOpen, setSubscribeOpen] = useState(false)

  const sessionQuery = useSessionQuery()
  const user = sessionQuery.data ?? null
  const isAuthenticated = Boolean(user)

  const bookQuery = useBookQuery(bookId)
  const ratingQuery = useBookRatingQuery(bookId)
  const genreTagsQuery = useBookGenreTagsQuery(bookId)

  const accessQuery = useBookAccessQuery(bookId, {
    enabled: isAuthenticated,
  })

  const ratingMutation = usePutBookRatingMutation(bookId)
  const createReviewMutation = useCreateReviewMutation(bookId)
  const downloadBookFile = useDownloadBookFileMutation(bookId)
  const recordReadMutation = useRecordBookReadMutation(bookId)

  const book = bookQuery.data
  const rating = ratingQuery.data

  const genre = useMemo(() => {
    const names = genreTagsQuery.data?.map((tag) => tag.name) ?? []

    return names.length > 0 ? names.join(', ') : 'Жанр не указан'
  }, [genreTagsQuery.data])

  const selectedScore = rating?.my_rating ?? book?.my_rating ?? null

  const userLabel = user ? (user.displayTag ?? user.username) : null

  const canIssueReviewPromo =
    Boolean(user) && user?.role === 'author' && user.id === book?.author_id

  const canRead = accessQuery.data?.can_read

  const isPurchased = accessQuery.data
    ? isPurchasedAccess(accessQuery.data)
    : false
  const isSubscriptionOnlyAccess = Boolean(canRead && !isPurchased)

  const invalidateBookDetails = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: bookKeys.details(bookId),
    })
  }, [bookId, queryClient])

  const invalidateBookRating = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: bookKeys.rating(bookId),
    })
  }, [bookId, queryClient])

  const invalidateBookAccess = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: bookKeys.access(bookId),
    })
  }, [bookId, queryClient])

  const invalidateBookData = useCallback(() => {
    invalidateBookDetails()
    invalidateBookRating()
    invalidateBookAccess()
  }, [invalidateBookAccess, invalidateBookDetails, invalidateBookRating])

  const requireAuth = useCallback(() => {
    if (user) {
      return true
    }

    void navigate({ to: '/login' })

    return false
  }, [navigate, user])

  const handleScoreSelect = useCallback(
    async (score: number) => {
      if (!requireAuth()) {
        return
      }

      try {
        await ratingMutation.mutateAsync({ score })
        invalidateBookDetails()
        invalidateBookRating()
      } catch {
        // pass
      }
    },
    [invalidateBookDetails, invalidateBookRating, ratingMutation, requireAuth],
  )

  const handleReviewSubmit = useCallback(
    async (payload: ReviewFormSubmitPayload) => {
      if (!requireAuth()) {
        return
      }

      try {
        await createReviewMutation.mutateAsync({
          rating: selectedScore ?? 5,
          sentiment: payload.sentiment,
          text: payload.text,
        })

        invalidateBookDetails()
        invalidateBookRating()
      } catch {
        // pass
      }
    },
    [
      createReviewMutation,
      invalidateBookDetails,
      invalidateBookRating,
      requireAuth,
      selectedScore,
    ],
  )

  const handleRead = useCallback(async () => {
    if (!requireAuth() || !book) {
      return
    }

    if (!canRead) {
      if (book.is_in_subscription) {
        setSubscribeOpen(true)
      } else if (book.is_for_sale) {
        setPurchaseOpen(true)
      }

      return
    }

    await navigate({ to: '/reader/$bookId', params: { bookId } })
  }, [book, bookId, canRead, navigate, requireAuth])

  const handleAddToLibrary = useCallback(async () => {
    if (!requireAuth() || !book) {
      return
    }

    if (!canRead || !book.is_in_subscription || isPurchased) {
      return
    }

    try {
      await recordReadMutation.mutateAsync()
      invalidateBookAccess()
      invalidateBookDetails()
    } catch {
      // pass
    }
  }, [
    book,
    canRead,
    invalidateBookAccess,
    invalidateBookDetails,
    isPurchased,
    recordReadMutation,
    requireAuth,
  ])

  const handleDownload = useCallback(
    async (format: BookFormat) => {
      if (!requireAuth() || !book || !canRead) {
        return
      }

      if (!isPurchased) {
        if (book.is_for_sale) {
          setPurchaseOpen(true)
        }

        return
      }

      try {
        const blob = await downloadBookFile.mutateAsync()
        downloadBlob(blob, getDownloadFileName(book.title, format))
      } catch {
        // pass
      }
    },
    [book, canRead, downloadBookFile, isPurchased, requireAuth],
  )

  const handleBuy = useCallback(() => {
    if (requireAuth()) {
      setPurchaseOpen(true)
    }
  }, [requireAuth])

  const handlePurchaseClose = useCallback(() => {
    setPurchaseOpen(false)
    invalidateBookAccess()
    invalidateBookDetails()
  }, [invalidateBookAccess, invalidateBookDetails])

  const handleSubscribeClose = useCallback(() => {
    setSubscribeOpen(false)
    invalidateBookData()
  }, [invalidateBookData])

  const handleAddToLibraryProp = useCallback(() => {
    void handleAddToLibrary()
  }, [handleAddToLibrary])

  const handleReadProp = useCallback(() => {
    void handleRead()
  }, [handleRead])

  const handleScoreSelectProp = useCallback(
    (score: number) => {
      void handleScoreSelect(score)
    },
    [handleScoreSelect],
  )

  const handleDownloadProp = useCallback(
    (format: BookFormat) => {
      void handleDownload(format)
    },
    [handleDownload],
  )

  const handleReviewSubmitProp = useCallback(
    (payload: ReviewFormSubmitPayload) => {
      void handleReviewSubmit(payload)
    },
    [handleReviewSubmit],
  )

  if (bookQuery.isLoading) {
    return (
      <main className={styles.page}>
        <Helmet>
          <title>Книга</title>
          <meta name="description" content="Загружаем страницу книги." />
        </Helmet>

        <div className={styles.pageContent}>
          <p className={styles.state}>
            <Spinner label="Загружаем книгу" />
          </p>
        </div>
      </main>
    )
  }

  if (!book) {
    return (
      <main className={styles.page}>
        <Helmet>
          <title>Книга не найдена</title>
          <meta name="description" content="Книга не найдена в AeonBiblio." />
        </Helmet>

        <div className={styles.pageContent}>
          <p className={styles.state}>Книга не найдена</p>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <Helmet>
        <title>{book.title}</title>
        <meta
          name="description"
          content={getBookMetaDescription(book.title, book.description)}
        />
      </Helmet>

      <div className={styles.pageContent}>
        <BookDetailsCard
          author={getAuthorLabel(book)}
          buyLabel={
            book.is_for_sale ? formatRubles(book.sale_price) : 'Не продается'
          }
          complainDisabled
          coverSrc={getCoverSrc(book.cover_key)}
          description={book.description ?? 'Описание пока не добавлено'}
          genre={genre}
          rating={Number(rating?.average_rating ?? book.average_rating ?? 0)}
          ratingsCount={rating?.ratings_count ?? book.ratings_count}
          reviewsCount={rating?.reviews_count ?? book.reviews_count}
          readDisabled={accessQuery.isLoading}
          selectedScore={selectedScore}
          scoreDisabled={ratingMutation.isPending}
          showBuyButton={book.is_for_sale && !isPurchased}
          subscriptionLabel={getReadLabel(
            canRead,
            book.is_in_subscription,
            accessQuery.isLoading,
          )}
          title={book.title}
          onAddToLibrary={handleAddToLibraryProp}
          onBuy={handleBuy}
          paysAuthorFromSubscription={hasSubscriptionPayout(
            book.subscription_payout_amount,
          )}
          onRead={handleReadProp}
          onScoreSelect={handleScoreSelectProp}
        />

        <BookDownloadSection
          buttonLabel={
            downloadBookFile.isPending
              ? 'Скачиваем...'
              : isSubscriptionOnlyAccess && book.is_for_sale
                ? 'Купить для скачивания'
                : isSubscriptionOnlyAccess
                  ? 'Скачивание недоступно'
                  : undefined
          }
          disabled={
            downloadBookFile.isPending ||
            accessQuery.isLoading ||
            (isSubscriptionOnlyAccess && !book.is_for_sale)
          }
          format={book.file_format ?? null}
          onDownload={handleDownloadProp}
        />

        <BookFeedbackSections
          bookId={bookId}
          canIssuePromo={canIssueReviewPromo}
          createReviewPending={createReviewMutation.isPending}
          userLabel={userLabel}
          onReviewSubmit={handleReviewSubmitProp}
        />
      </div>

      {purchaseOpen && (
        <Suspense fallback={null}>
          <PurchaseBookModal
            bookId={bookId}
            open={purchaseOpen}
            onClose={handlePurchaseClose}
          />
        </Suspense>
      )}

      {subscribeOpen && (
        <Suspense fallback={null}>
          <SubscribeModal onClose={handleSubscribeClose} />
        </Suspense>
      )}
    </main>
  )
}
