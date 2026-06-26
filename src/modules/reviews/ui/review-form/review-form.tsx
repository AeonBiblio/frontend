import clsx from 'clsx'
import { useState } from 'react'

import profileAvatar from '@shared/assets/images/profile-avatar.png'

import styles from './review-form.module.scss'

import type { FormEvent } from 'react'
import type { ReviewSentiment } from '@shared/api/core'

type SentimentOption = {
  label: string
  value: ReviewSentiment
}

const sentimentOptions: SentimentOption[] = [
  { label: 'Положительная', value: 'positive' },
  { label: 'Отрицательная', value: 'negative' },
  { label: 'Нейтральная', value: 'neutral' },
]

export type ReviewFormSubmitPayload = {
  sentiment: ReviewSentiment
  text: string
}

export type ReviewFormProps = {
  avatarSrc?: string
  className?: string
  dateLabel?: string
  defaultSentiment?: ReviewSentiment
  defaultText?: string
  disabled?: boolean
  onSubmit?: (payload: ReviewFormSubmitPayload) => void
  submitLabel?: string
  userLabel: string
}

export function ReviewForm({
  avatarSrc = profileAvatar,
  className,
  dateLabel,
  defaultSentiment = 'positive',
  defaultText = '',
  disabled = false,
  onSubmit,
  submitLabel = 'Опубликовать',
  userLabel,
}: ReviewFormProps) {
  const [sentiment, setSentiment] = useState(defaultSentiment)
  const [text, setText] = useState(defaultText)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (disabled || !text.trim()) {
      return
    }

    onSubmit?.({ sentiment, text: text.trim() })
  }

  return (
    <form className={clsx(styles.form, className)} onSubmit={handleSubmit}>
      <header className={styles.formHeader}>
        <div className={styles.formUser}>
          <img className={styles.formAvatar} src={avatarSrc} alt="" />
          <span className={styles.formName}>{userLabel}</span>
        </div>
        {dateLabel && <span className={styles.formDate}>{dateLabel}</span>}
      </header>

      <div className={styles.formBody}>
        <div className={styles.formSentiments} role="radiogroup">
          {sentimentOptions.map((option) => (
            <button
              className={styles.formSentiment}
              type="button"
              key={option.value}
              data-active={sentiment === option.value || undefined}
              disabled={disabled}
              role="radio"
              aria-checked={sentiment === option.value}
              onClick={() => setSentiment(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <textarea
          className={styles.formTextarea}
          value={text}
          disabled={disabled}
          placeholder="Текст"
          onChange={(event) => setText(event.target.value)}
        />

        <button
          className={styles.formSubmit}
          type="submit"
          disabled={disabled || !text.trim()}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
