import {
  READER_FONT_OPTIONS,
  READER_THEME_LABELS,
} from '@domain/reader/display-settings'

import AlignCenterIcon from '@shared/assets/icons/reader-align-center.svg?react'
import AlignJustifyIcon from '@shared/assets/icons/reader-align-justify.svg?react'
import AlignLeftIcon from '@shared/assets/icons/reader-align-left.svg?react'
import AlignRightIcon from '@shared/assets/icons/reader-align-right.svg?react'
import TextDensityCompactIcon from '@shared/assets/icons/reader-text-density-compact.svg?react'
import TextDensityLooseIcon from '@shared/assets/icons/reader-text-density-loose.svg?react'
import TextDensityRegularIcon from '@shared/assets/icons/reader-text-density-regular.svg?react'

import styles from './reader-settings-panel.module.scss'

import type {
  ReaderColorTheme,
  ReaderDisplaySettings,
  ReaderTextAlign,
} from '@domain/reader/display-settings'

export type ReaderDownloadAllState = 'idle' | 'pending' | 'success' | 'error'

type ReaderSettingsPanelProps = {
  downloadAllState?: ReaderDownloadAllState
  onChange: (settings: ReaderDisplaySettings) => void
  onDownloadAll?: () => void
  settings: ReaderDisplaySettings
}

const themeOrder: ReaderColorTheme[] = ['white', 'warm', 'black']
const lineHeightOptions = [
  {
    Icon: TextDensityCompactIcon,
    label: 'Компактный межстрочный интервал',
    value: 1.45,
  },
  {
    Icon: TextDensityRegularIcon,
    label: 'Средний межстрочный интервал',
    value: 1.78,
  },
  {
    Icon: TextDensityLooseIcon,
    label: 'Свободный межстрочный интервал',
    value: 2.1,
  },
] as const
const alignOptions = [
  {
    Icon: AlignLeftIcon,
    label: 'Выравнивание по левому краю',
    value: 'left' satisfies ReaderTextAlign,
  },
  {
    Icon: AlignCenterIcon,
    label: 'Выравнивание по центру',
    value: 'center' satisfies ReaderTextAlign,
  },
  {
    Icon: AlignJustifyIcon,
    label: 'Выравнивание по ширине',
    value: 'justify' satisfies ReaderTextAlign,
  },
  {
    Icon: AlignRightIcon,
    label: 'Выравнивание по правому краю',
    value: 'right' satisfies ReaderTextAlign,
  },
] as const
const fontWeightOptions = [
  {
    label: 'Обычный',
    value: 400,
  },
  {
    label: 'Средний',
    value: 500,
  },
  {
    label: 'Жирный',
    value: 700,
  },
] as const
const pageSwitches = [
  {
    key: 'enableKeyboardArrows',
    label: 'Стрелочки на клавиатуре',
  },
  {
    key: 'enableReaderArrows',
    label: 'Стрелочки в ридере',
  },
  {
    key: 'enableWheelNavigation',
    label: 'Колесо мыши',
  },
  {
    key: 'enableKeyboardLetters',
    label: 'A/D на клавиатуре',
  },
  {
    key: 'limitWheelToOnePage',
    label: 'Ограничить прокрутку колеса одной страницей',
  },
] as const

function updateSettings(
  settings: ReaderDisplaySettings,
  patch: Partial<ReaderDisplaySettings>,
) {
  return {
    ...settings,
    ...patch,
  }
}

function getDownloadAllLabel(state: ReaderDownloadAllState) {
  switch (state) {
    case 'pending':
      return 'Скачиваем...'
    case 'success':
      return 'Книга загружена'
    case 'error':
      return 'Повторить загрузку'
    case 'idle':
      return 'Скачать всё'
  }
}

export function ReaderSettingsPanel({
  downloadAllState = 'idle',
  onChange,
  onDownloadAll,
  settings,
}: ReaderSettingsPanelProps) {
  const setFontSize = (nextFontSize: number) => {
    onChange(
      updateSettings(settings, {
        fontSize: Math.min(32, Math.max(16, nextFontSize)),
      }),
    )
  }

  return (
    <aside className={styles.panel} aria-label="Настройки чтения">
      <div className={styles.fontSizeRow}>
        <button
          className={styles.textButton}
          type="button"
          aria-label="Уменьшить размер текста"
          onClick={() => setFontSize(settings.fontSize - 1)}
        >
          - тТ
        </button>
        <output className={styles.fontSizeValue}>{settings.fontSize}</output>
        <button
          className={styles.textButton}
          type="button"
          aria-label="Увеличить размер текста"
          onClick={() => setFontSize(settings.fontSize + 1)}
        >
          тТ +
        </button>
      </div>

      <div className={styles.themeRow} aria-label="Цветовая тема">
        {themeOrder.map((theme) => (
          <button
            className={styles.themeButton}
            data-theme={theme}
            type="button"
            aria-pressed={settings.colorTheme === theme}
            key={theme}
            onClick={() =>
              onChange(updateSettings(settings, { colorTheme: theme }))
            }
          >
            {READER_THEME_LABELS[theme]}
          </button>
        ))}
      </div>

      <div className={styles.lineHeightRow} aria-label="Межстрочный интервал">
        {lineHeightOptions.map(({ Icon, label, value }) => (
          <button
            className={styles.lineHeightButton}
            type="button"
            aria-label={label}
            aria-pressed={settings.lineHeight === value}
            key={value}
            onClick={() =>
              onChange(updateSettings(settings, { lineHeight: value }))
            }
          >
            <Icon aria-hidden="true" />
          </button>
        ))}
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Переключение страницы</h2>
        <div className={styles.switchList}>
          {pageSwitches.map((item) => (
            <label className={styles.switchItem} key={item.key}>
              <input
                type="checkbox"
                checked={settings[item.key]}
                onChange={(event) =>
                  onChange(
                    updateSettings(settings, {
                      [item.key]: event.currentTarget.checked,
                    }),
                  )
                }
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Выравнивание</h2>
        <div className={styles.alignRow}>
          {alignOptions.map(({ Icon, label, value }) => (
            <button
              className={styles.alignButton}
              type="button"
              aria-label={label}
              aria-pressed={settings.textAlign === value}
              key={value}
              onClick={() =>
                onChange(updateSettings(settings, { textAlign: value }))
              }
            >
              <Icon aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Шрифт</h2>
        <div className={styles.fontGrid}>
          {READER_FONT_OPTIONS.map((font) => (
            <button
              className={styles.fontButton}
              type="button"
              aria-pressed={settings.fontFamily === font.value}
              key={font.value}
              onClick={() =>
                onChange(
                  updateSettings(settings, {
                    fontFamily: font.value,
                    fontLabel: font.label,
                  }),
                )
              }
            >
              {font.label}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Жирность</h2>
        <div className={styles.fontWeightRow}>
          {fontWeightOptions.map((option) => (
            <button
              className={styles.fontWeightButton}
              type="button"
              aria-pressed={settings.fontWeight === option.value}
              key={option.value}
              onClick={() =>
                onChange(updateSettings(settings, { fontWeight: option.value }))
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {onDownloadAll ? (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Оффлайн</h2>
          <button
            className={styles.downloadAllButton}
            type="button"
            disabled={
              downloadAllState === 'pending' || downloadAllState === 'success'
            }
            onClick={onDownloadAll}
          >
            {getDownloadAllLabel(downloadAllState)}
          </button>
        </section>
      ) : null}
    </aside>
  )
}
