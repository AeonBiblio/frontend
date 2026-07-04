import clsx from 'clsx'
import { useState } from 'react'

import styles from './cover-image.module.scss'

type CoverImageProps = {
  alt: string
  className?: string
  decoding?: 'async' | 'auto' | 'sync'
  fetchPriority?: 'high' | 'low' | 'auto'
  height?: number
  loading?: 'eager' | 'lazy'
  src: string
  width?: number
}

export function CoverImage({
  alt,
  className,
  decoding,
  fetchPriority,
  height,
  loading,
  src,
  width,
}: CoverImageProps) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div
        className={clsx(styles.placeholder, className)}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
      >
        <span>Не удалось загрузить изображение</span>
      </div>
    )
  }

  return (
    <img
      alt={alt}
      className={className}
      decoding={decoding}
      fetchPriority={fetchPriority}
      height={height}
      loading={loading}
      src={src}
      width={width}
      onError={() => setHasError(true)}
    />
  )
}
