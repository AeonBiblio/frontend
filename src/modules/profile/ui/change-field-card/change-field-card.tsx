import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { SurfaceCard } from '@shared/ui/surface-card'

import styles from './change-field-card.module.scss'

const changeFieldSchema = z.object({
  currentValue: z.string().min(1),
  nextValue: z.string().min(1),
})

type ChangeFieldFormValues = z.infer<typeof changeFieldSchema>

type ChangeFieldCardProps = {
  color?: string
  currentValue?: string
  fieldLabel?: string
  nextValue?: string
}

export function ChangeFieldCard({
  color = '#f5f6ff',
  currentValue = 'myexampleemail@gmail.com',
  fieldLabel = 'Поле изменения',
  nextValue = currentValue,
}: ChangeFieldCardProps) {
  const form = useForm<ChangeFieldFormValues>({
    resolver: zodResolver(changeFieldSchema),
    defaultValues: {
      currentValue,
      nextValue,
    },
  })

  useEffect(() => {
    form.reset({ currentValue, nextValue })
  }, [currentValue, form, nextValue])

  return (
    <SurfaceCard className={styles.card} color={color}>
      <form
        className={styles.cardForm}
        onSubmit={form.handleSubmit(() => undefined)}
      >
        <h2 className={styles.cardTitle}>{fieldLabel}</h2>

        <label className={styles.cardField}>
          <span className={styles.cardLabel}>Старое</span>
          <input
            className={styles.cardInput}
            {...form.register('currentValue')}
          />
        </label>

        <label className={styles.cardField}>
          <span className={styles.cardLabel}>Новое</span>
          <input className={styles.cardInput} {...form.register('nextValue')} />
        </label>

        <button className={styles.cardSubmit} type="submit">
          Подтвердить
        </button>
      </form>
    </SurfaceCard>
  )
}
