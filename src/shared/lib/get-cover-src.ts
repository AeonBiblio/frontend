import shantaramCover from '@shared/assets/images/shantaram-cover.png'

function getMediaBaseUrl() {
  return (import.meta.env.VITE_MEDIA_BASE_URL as string | undefined)?.replace(
    /\/$/,
    '',
  )
}

export function getCoverSrc(coverKey: string | null | undefined) {
  if (!coverKey) {
    return shantaramCover
  }

  if (
    coverKey.startsWith('blob:') ||
    coverKey.startsWith('data:') ||
    coverKey.startsWith('http://') ||
    coverKey.startsWith('https://')
  ) {
    return coverKey
  }

  const mediaBaseUrl = getMediaBaseUrl()

  return mediaBaseUrl
    ? `${mediaBaseUrl}/${coverKey.replace(/^\//, '')}`
    : shantaramCover
}

export { shantaramCover as defaultCoverSrc }
