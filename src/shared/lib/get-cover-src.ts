import shantaramCover from '@shared/assets/images/shantaram-cover.png'

export function getCoverSrc(coverKey: string | null | undefined) {
  if (!coverKey) {
    return shantaramCover
  }

  if (coverKey.startsWith('http://') || coverKey.startsWith('https://')) {
    return coverKey
  }

  // Object keys from MinIO (e.g. covers/uuid.jpg) are not public URLs yet.
  return shantaramCover
}
