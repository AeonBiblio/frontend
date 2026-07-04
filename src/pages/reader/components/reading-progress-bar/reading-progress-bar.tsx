import styles from './reading-progress-bar.module.scss'

type ReadingProgressBarProps = {
  centerLabel?: string
  onCenterAction?: () => void
  leftLabel: string
  percent: number
  rightLabel?: string
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(100, Math.max(0, value))
}

export function ReadingProgressBar({
  centerLabel,
  leftLabel,
  onCenterAction,
  percent,
  rightLabel,
}: ReadingProgressBarProps) {
  const safePercent = clampPercent(percent)

  return (
    <div className={styles.progress} aria-label="Прогресс чтения">
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ inlineSize: `${safePercent}%` }}
        />
      </div>
      <div className={styles.meta}>
        <span className={styles.label}>{leftLabel}</span>
        {centerLabel ? (
          onCenterAction ? (
            <button
              className={styles.centerButton}
              type="button"
              onClick={onCenterAction}
            >
              {centerLabel}
            </button>
          ) : (
            <span className={styles.centerLabel}>{centerLabel}</span>
          )
        ) : null}
        <span className={styles.value}>
          {rightLabel ?? `${safePercent.toFixed(2)}%`}
        </span>
      </div>
    </div>
  )
}
