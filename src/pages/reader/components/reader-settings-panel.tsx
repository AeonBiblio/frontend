import {
  READER_FONT_OPTIONS,
  READER_THEME_LABELS,
} from '@modules/reader/model/display-settings'

import AlignCenterIcon from '@shared/assets/icons/reader-align-center.svg?react'
import AlignJustifyIcon from '@shared/assets/icons/reader-align-justify.svg?react'
import AlignLeftIcon from '@shared/assets/icons/reader-align-left.svg?react'
import AlignRightIcon from '@shared/assets/icons/reader-align-right.svg?react'
import textDensityCompactIconUrl from '@shared/assets/icons/reader-text-density-compact.svg'
import textDensityLooseIconUrl from '@shared/assets/icons/reader-text-density-loose.svg'
import textDensityRegularIconUrl from '@shared/assets/icons/reader-text-density-regular.svg'

import styles from './reader-settings-panel.module.scss'

import type {
  ReaderColorTheme,
  ReaderDisplaySettings,
  ReaderTextAlign,
} from '@modules/reader/model/display-settings'

type ReaderSettingsPanelProps = {
  onChange: (settings: ReaderDisplaySettings) => void
  settings: ReaderDisplaySettings
}

const themeOrder: ReaderColorTheme[] = ['white', 'warm', 'black']
const lineHeightOptions = [
  {
    icon: textDensityCompactIconUrl,
    label: 'Компактный межстрочный интервал',
    value: 1.45,
  },
  {
    icon: textDensityRegularIconUrl,
    label: 'Средний межстрочный интервал',
    value: 1.78,
  },
  {
    icon: textDensityLooseIconUrl,
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

export function ReaderSettingsPanel({
  onChange,
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
        {lineHeightOptions.map((option) => (
          <button
            className={styles.lineHeightButton}
            type="button"
            aria-label={option.label}
            aria-pressed={settings.lineHeight === option.value}
            key={option.value}
            onClick={() =>
              onChange(updateSettings(settings, { lineHeight: option.value }))
            }
          >
            <img src={option.icon} alt="" />
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
    </aside>
  )
}
