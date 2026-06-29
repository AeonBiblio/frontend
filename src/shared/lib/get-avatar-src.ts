import profileAvatar from '@shared/assets/images/profile-avatar.png'

function getMediaBaseUrl() {
  return (import.meta.env.VITE_MEDIA_BASE_URL as string | undefined)?.replace(
    /\/$/,
    '',
  )
}

export function getAvatarSrc(
  avatarKey: string | null | undefined,
  avatarUrl?: string,
) {
  if (avatarUrl) {
    return avatarUrl
  }

  if (!avatarKey) {
    return profileAvatar
  }

  if (
    avatarKey.startsWith('blob:') ||
    avatarKey.startsWith('data:') ||
    avatarKey.startsWith('http://') ||
    avatarKey.startsWith('https://')
  ) {
    return avatarKey
  }

  const mediaBaseUrl = getMediaBaseUrl()

  return mediaBaseUrl
    ? `${mediaBaseUrl}/${avatarKey.replace(/^\//, '')}`
    : profileAvatar
}

export { profileAvatar as defaultAvatarSrc }
