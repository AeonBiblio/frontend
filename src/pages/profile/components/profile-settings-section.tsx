import { ChangeFieldCard } from '@modules/profile/ui/change-field-card'
import { ProfileCard } from '@modules/profile/ui/profile-card'

import styles from '../profile-page.module.scss'

import type { ProfileEditableField } from '@modules/profile/ui/profile-card'

type ProfileSettingsSectionProps = {
  avatarSrc: string | undefined
  cardLastDigits: string
  email: string
  fieldError: string | undefined
  fieldMessage: string | undefined
  onAvatarFile: (file: File) => void
  onEditField: (field: ProfileEditableField) => void
  onFieldSubmit: ({ nextValue }: { nextValue: string }) => void
  selectedField: ProfileEditableField
  userName: string
}

export function ProfileSettingsSection({
  avatarSrc,
  cardLastDigits,
  email,
  fieldError,
  fieldMessage,
  onAvatarFile,
  onEditField,
  onFieldSubmit,
  selectedField,
  userName,
}: ProfileSettingsSectionProps) {
  return (
    <div className={styles.pageContentBodyUp}>
      <ProfileCard
        avatarSrc={avatarSrc}
        cardLastDigits={cardLastDigits}
        color="#f5f6ff"
        email={email}
        name={userName}
        onAvatarFile={onAvatarFile}
        onEditField={onEditField}
      />

      <ChangeFieldCard
        color="#f5f6ff"
        currentValue={selectedField.value}
        fieldLabel={selectedField.label}
        nextValue={selectedField.value}
        onSubmit={onFieldSubmit}
        submitError={fieldError}
        submitSuccess={fieldMessage}
      />
    </div>
  )
}
