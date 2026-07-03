import { db } from '@shared/lib/db'
import {
  createOutboxItem,
  flushOutboxSoon,
} from '@modules/offline/model/enqueue-outbox-item'
import {
  DEFAULT_READER_DISPLAY_SETTINGS,
  READER_FONT_OPTIONS,
} from '@modules/reader/model/display-settings'

import type { LocalReaderSettings, ReaderTheme } from '@shared/lib/db'
import type {
  ReaderColorTheme,
  ReaderDisplaySettings,
  ReaderTextAlign,
} from '@modules/reader/model/display-settings'

const SETTINGS_SYNC_DELAY_MS = 700
const timers = new Map<string, number>()

function createReaderSettingsId(userId: string, bookId: string) {
  return `${userId}:${bookId}`
}

function colorThemeToReaderTheme(theme: ReaderColorTheme): ReaderTheme {
  if (theme === 'black') {
    return 'dark'
  }

  if (theme === 'warm') {
    return 'sepia'
  }

  return 'light'
}

function readerThemeToColorTheme(theme: ReaderTheme): ReaderColorTheme {
  if (theme === 'dark') {
    return 'black'
  }

  if (theme === 'sepia') {
    return 'warm'
  }

  return 'white'
}

function getFontLabel(fontFamily: string) {
  return (
    READER_FONT_OPTIONS.find((font) => font.value === fontFamily)?.label ??
    DEFAULT_READER_DISPLAY_SETTINGS.fontLabel
  )
}

function normalizeReaderFontFamily(fontFamily: string) {
  if (fontFamily === 'var(--font-main)') {
    return 'var(--font-reader-inter)'
  }

  if (fontFamily === 'var(--font-accent)') {
    return 'var(--font-reader-garamond)'
  }

  return fontFamily
}

function normalizeTextAlign(textAlign: string): ReaderTextAlign {
  if (
    textAlign === 'left' ||
    textAlign === 'center' ||
    textAlign === 'justify' ||
    textAlign === 'right'
  ) {
    return textAlign
  }

  return DEFAULT_READER_DISPLAY_SETTINGS.textAlign
}

function localSettingsToDisplaySettings(
  settings: LocalReaderSettings,
): ReaderDisplaySettings {
  const fontFamily = normalizeReaderFontFamily(settings.fontFamily)

  return {
    ...DEFAULT_READER_DISPLAY_SETTINGS,
    colorTheme: readerThemeToColorTheme(settings.theme),
    columnGap: settings.columnGap,
    columnsPerPage:
      settings.columnsPerPage ?? DEFAULT_READER_DISPLAY_SETTINGS.columnsPerPage,
    enableKeyboardArrows:
      settings.enableKeyboardArrows ??
      DEFAULT_READER_DISPLAY_SETTINGS.enableKeyboardArrows,
    enableKeyboardLetters:
      settings.enableKeyboardLetters ??
      DEFAULT_READER_DISPLAY_SETTINGS.enableKeyboardLetters,
    enableReaderArrows:
      settings.enableReaderArrows ??
      DEFAULT_READER_DISPLAY_SETTINGS.enableReaderArrows,
    enableWheelNavigation:
      settings.enableWheelNavigation ??
      DEFAULT_READER_DISPLAY_SETTINGS.enableWheelNavigation,
    limitWheelToOnePage:
      settings.limitWheelToOnePage ??
      DEFAULT_READER_DISPLAY_SETTINGS.limitWheelToOnePage,
    fontFamily,
    fontLabel: getFontLabel(fontFamily),
    fontSize: settings.fontSize,
    fontWeight:
      settings.fontWeight ?? DEFAULT_READER_DISPLAY_SETTINGS.fontWeight,
    lineHeight: settings.lineHeight,
    margin: settings.margin,
    textAlign: normalizeTextAlign(settings.textAlign),
  }
}

function displaySettingsToLocalSettings({
  bookId,
  existing,
  settings,
  userId,
}: {
  bookId: string
  existing?: LocalReaderSettings
  settings: ReaderDisplaySettings
  userId: string
}): LocalReaderSettings {
  return {
    id: createReaderSettingsId(userId, bookId),
    userId,
    bookId,
    theme: colorThemeToReaderTheme(settings.colorTheme),
    fontFamily: settings.fontFamily,
    fontSize: settings.fontSize,
    fontWeight: settings.fontWeight,
    lineHeight: settings.lineHeight,
    pageMode: 'paginated',
    textAlign: settings.textAlign,
    margin: settings.margin,
    columnGap: settings.columnGap,
    columnsPerPage: settings.columnsPerPage,
    enableKeyboardArrows: settings.enableKeyboardArrows,
    enableKeyboardLetters: settings.enableKeyboardLetters,
    enableReaderArrows: settings.enableReaderArrows,
    enableWheelNavigation: settings.enableWheelNavigation,
    limitWheelToOnePage: settings.limitWheelToOnePage,
    updatedAt: new Date().toISOString(),
    syncedAt: existing?.syncedAt,
    dirty: true,
  }
}

function clearSettingsTimer(id: string) {
  const timer = timers.get(id)

  if (timer !== undefined) {
    window.clearTimeout(timer)
    timers.delete(id)
  }
}

function settingsToRequestBody(settings: LocalReaderSettings) {
  return {
    theme: settings.theme,
    font_family: settings.fontFamily,
    font_size: settings.fontSize,
    font_weight: settings.fontWeight,
    line_height: settings.lineHeight,
    page_mode: settings.pageMode,
    text_align: settings.textAlign,
    margin: settings.margin,
    column_gap: settings.columnGap,
    columns_per_page: settings.columnsPerPage,
    enable_keyboard_arrows: settings.enableKeyboardArrows,
    enable_keyboard_letters: settings.enableKeyboardLetters,
    enable_reader_arrows: settings.enableReaderArrows,
    enable_wheel_navigation: settings.enableWheelNavigation,
    limit_wheel_to_one_page: settings.limitWheelToOnePage,
    updated_at: settings.updatedAt,
  }
}

async function upsertSettingsOutboxItem(settings: LocalReaderSettings) {
  const existing = await db.outbox
    .where('[type+entityId]')
    .equals(['http.request', settings.id])
    .filter((item) => item.status !== 'processing')
    .first()
  const payload = {
    method: 'put' as const,
    path: `/books/${settings.bookId}/reader/settings`,
    body: settingsToRequestBody(settings),
  }

  if (existing && existing.type === 'http.request') {
    await db.outbox.put({
      ...existing,
      payload,
      status:
        existing.status === 'failed' || existing.status === 'bg_sync_queued'
          ? 'pending'
          : existing.status,
      updatedAt: new Date().toISOString(),
      nextRetryAt: undefined,
      lastError: undefined,
    })
    return
  }

  await db.outbox.put(
    createOutboxItem({
      type: 'http.request',
      entityId: settings.id,
      userId: settings.userId,
      bookId: settings.bookId,
      payload,
    }),
  )
}

export async function loadReaderDisplaySettings(
  userId: string,
  bookId: string,
) {
  const localSettings = await db.readerSettings.get(
    createReaderSettingsId(userId, bookId),
  )

  if (!localSettings) {
    return null
  }

  return localSettingsToDisplaySettings(localSettings)
}

export async function saveReaderDisplaySettings({
  bookId,
  settings,
  userId,
}: {
  bookId: string
  settings: ReaderDisplaySettings
  userId: string
}) {
  const id = createReaderSettingsId(userId, bookId)
  const existing = await db.readerSettings.get(id)
  const localSettings = displaySettingsToLocalSettings({
    bookId,
    existing,
    settings,
    userId,
  })

  await db.readerSettings.put(localSettings)

  if (typeof window === 'undefined') {
    return
  }

  clearSettingsTimer(id)

  const timer = window.setTimeout(() => {
    timers.delete(id)
    void upsertSettingsOutboxItem(localSettings).then(flushOutboxSoon)
  }, SETTINGS_SYNC_DELAY_MS)

  timers.set(id, timer)
}
