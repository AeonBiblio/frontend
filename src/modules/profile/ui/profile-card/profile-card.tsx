import { DndContext, useDroppable } from '@dnd-kit/core'
import { useRef, useState } from 'react'

import CardIcon from '@shared/assets/icons/bde0daa0-04e4-5941-be9b-38e3c50b96e3 1.svg?react'
import { SurfaceCard } from '@shared/ui/surface-card'
import profileAvatar from '@shared/assets/images/profile-avatar.png'

import styles from './profile-card.module.scss'

import type { DragEvent } from 'react'

export type ProfileEditableField = {
  id: 'name' | 'email' | 'password' | 'card'
  label: string
  value: string
}

type ProfileCardProps = {
  cardLastDigits?: string
  color?: string
  email?: string
  name?: string
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
  const { setNodeRef, isOver } = useDroppable({ id: 'profile-avatar' })

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
        ref={setNodeRef}
        className={styles.cardAvatarButton}
        type="button"
        aria-label="Загрузить аватар"
        data-over={isOver || undefined}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <img className={styles.cardAvatar} src={avatarSrc} alt="" />
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
  field,
  onEditField,
}: {
  field: ProfileEditableField
  onEditField?: (field: ProfileEditableField) => void
}) {
  return (
    <div className={styles.cardField}>
      <span className={styles.cardFieldValue}>{field.value}</span>
      <button
        className={styles.cardFieldButton}
        type="button"
        onClick={() => onEditField?.(field)}
      >
        изменить
      </button>
    </div>
  )
}

export function ProfileCard({
  cardLastDigits = '0742',
  color = '#f5f6ff',
  email = 'myexampleemail@gmail.com',
  name = 'Грушев Василий Львович #1234',
  onEditField,
  password = '***************',
}: ProfileCardProps) {
  const [avatarSrc, setAvatarSrc] = useState(profileAvatar)

  const handleAvatarFile = (file: File) => {
    setAvatarSrc(URL.createObjectURL(file))
  }

  return (
    <SurfaceCard className={styles.card} color={color}>
      <DndContext>
        <AvatarDropzone avatarSrc={avatarSrc} onFile={handleAvatarFile} />
      </DndContext>

      <div className={styles.cardFields}>
        <ProfileField
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
