import { Helmet } from 'react-helmet-async'

import {
  useCreateReadlistMutation,
  useEnrichedBooksQuery,
  useRecentBooksQuery,
} from '@modules/library/api'
import { CollectionsSection, RecentBooksStrip } from '@modules/library/ui'
import { useRequireAuth } from '@shared/lib/use-require-auth'

import styles from './library-page.module.scss'

export function LibraryPage() {
  const { isAuthorized } = useRequireAuth()
  const recentQuery = useRecentBooksQuery({ enabled: isAuthorized })
  const createReadlistMutation = useCreateReadlistMutation()

  const recentBookIds = (recentQuery.data ?? []).map((item) => item.book_id)
  const enrichedRecentQuery = useEnrichedBooksQuery(recentBookIds, {
    enabled: isAuthorized && recentBookIds.length > 0,
  })

  if (!isAuthorized || recentQuery.isLoading) {
    return (
      <>
        <Helmet>
          <title>Библиотека</title>
          <meta
            name="description"
            content="Личная библиотека AeonBiblio с последними открытыми книгами и подборками."
          />
        </Helmet>
        <p className={styles.pageState}>Загружаем библиотеку...</p>
      </>
    )
  }

  if (recentQuery.isError) {
    return (
      <>
        <Helmet>
          <title>Библиотека</title>
          <meta
            name="description"
            content="Личная библиотека AeonBiblio с последними открытыми книгами и подборками."
          />
        </Helmet>
        <p className={styles.pageState}>Не удалось загрузить библиотеку</p>
      </>
    )
  }

  return (
    <div className={styles.page}>
      <Helmet>
        <title>Библиотека</title>
        <meta
          name="description"
          content="Личная библиотека AeonBiblio с последними открытыми книгами и подборками."
        />
      </Helmet>
      <section className={styles.pageSection}>
        <h1 className={styles.pageTitle}>Последние открытые</h1>
        <RecentBooksStrip
          books={enrichedRecentQuery.data ?? new Map()}
          items={recentQuery.data ?? []}
        />
      </section>

      <CollectionsSection
        isCreating={createReadlistMutation.isPending}
        onCreateCollection={async (title) => {
          await createReadlistMutation.mutateAsync({
            title,
            is_public: true,
          })
        }}
      />
    </div>
  )
}
