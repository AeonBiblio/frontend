import { useRef, useState } from 'react'

import CardIcon from '@shared/assets/icons/bde0daa0-04e4-5941-be9b-38e3c50b96e3 1.svg?react'
import { defaultAvatarSrc } from '@shared/lib/get-avatar-src'
import { SurfaceCard } from '@shared/ui/surface-card'

import styles from './profile-card.module.scss'

import type { DragEvent } from 'react'

export type ProfileEditableField = {
  id: 'name' | 'email' | 'password' | 'card'
  label: string
  value: string
}

type ProfileCardProps = {
  avatarSrc?: string
  cardLastDigits?: string
  color?: string
  email?: string
  name?: string
  onAvatarFile?: (file: File) => void
  onEditField?: (field: ProfileEditableField) => void
  password?: string
}

function AvatarDropzone({
  avatarSrc,
  onFile,
}: {
  avatarSrc: string
  onFile: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isOver, setIsOver] = useState(false)

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files.item(0)

    if (file) {
      onFile(file)
    }
  }

  return (
    <>
      <button
        className={styles.cardAvatarButton}
        type="button"
        aria-label="Загрузить аватар"
        data-over={isOver || undefined}
        onClick={() => inputRef.current?.click()}
        onDragEnter={() => setIsOver(true)}
        onDragLeave={() => setIsOver(false)}
        onDragOver={(event) => {
          event.preventDefault()
          setIsOver(true)
        }}
        onDrop={(event) => {
          setIsOver(false)
          handleDrop(event)
        }}
      >
        <img
          className={styles.cardAvatar}
          src={avatarSrc}
          alt=""
          onError={(event) => {
            if (event.currentTarget.src !== defaultAvatarSrc) {
              event.currentTarget.src = defaultAvatarSrc
            }
          }}
        />
      </button>
      <input
        ref={inputRef}
        className={styles.cardFileInput}
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.item(0)

          if (file) {
            onFile(file)
          }
        }}
      />
    </>
  )
}

function ProfileField({
  editable = false,
  field,
  onEditField,
}: {
  editable?: boolean
  field: ProfileEditableField
  onEditField?: (field: ProfileEditableField) => void
}) {
  return (
    <div className={styles.cardField}>
      <span className={styles.cardFieldValue}>{field.value}</span>
      {editable && (
        <button
          className={styles.cardFieldButton}
          type="button"
          onClick={() => onEditField?.(field)}
        >
          изменить
        </button>
      )}
    </div>
  )
}

export function ProfileCard({
  avatarSrc = defaultAvatarSrc,
  cardLastDigits = '0000',
  color = '#f5f6ff',
  email = 'myexampleemail@gmail.com',
  name = 'Грушев Василий Львович #1234',
  onAvatarFile,
  onEditField,
  password = '***************',
}: ProfileCardProps) {
  return (
    <SurfaceCard className={styles.card} color={color}>
      <AvatarDropzone
        avatarSrc={avatarSrc}
        onFile={(file) => onAvatarFile?.(file)}
      />

      <div className={styles.cardFields}>
        <ProfileField
          editable
          field={{ id: 'name', label: 'Имя', value: name }}
          onEditField={onEditField}
        />

        <ProfileField
          field={{ id: 'email', label: 'Почта', value: email }}
          onEditField={onEditField}
        />

        <ProfileField
          field={{ id: 'password', label: 'Пароль', value: password }}
          onEditField={onEditField}
        />

        <div className={styles.cardField}>
          <span className={styles.cardPayment}>
            <CardIcon className={styles.cardPaymentIcon} aria-hidden="true" />
            <span>**** **** ****</span>
            <span className={styles.cardPaymentDigits}>{cardLastDigits}</span>
          </span>
          <button
            className={styles.cardFieldButton}
            type="button"
            onClick={() =>
              onEditField?.({
                id: 'card',
                label: 'Карта',
                value: `**** **** **** ${cardLastDigits}`,
              })
            }
          >
            изменить
          </button>
        </div>
      </div>
    </SurfaceCard>
  )
}
