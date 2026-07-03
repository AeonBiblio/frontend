export type ReaderColorTheme = 'white' | 'warm' | 'black'
export type ReaderTextAlign = 'left' | 'center' | 'justify' | 'right'

export type ReaderDisplaySettings = {
  colorTheme: ReaderColorTheme
  columnGap: number
  columnsPerPage: number
  enableKeyboardArrows: boolean
  enableKeyboardLetters: boolean
  enableReaderArrows: boolean
  enableWheelNavigation: boolean
  limitWheelToOnePage: boolean
  fontFamily: string
  fontLabel: string
  fontSize: number
  fontWeight: number
  lineHeight: number
  margin: number
  textAlign: ReaderTextAlign
}

export const READER_THEME_LABELS: Record<ReaderColorTheme, string> = {
  white: 'Белый',
  warm: 'Тёплый',
  black: 'Чёрный',
}

export const READER_FONT_OPTIONS = [
  {
    label: 'Inter',
    value: 'var(--font-reader-inter)',
  },
  {
    label: 'EB Garamond',
    value: 'var(--font-reader-garamond)',
  },
  {
    label: 'Montserrat',
    value: 'var(--font-reader-montserrat)',
  },
  {
    label: 'Roboto',
    value: 'var(--font-reader-roboto)',
  },
] as const

export const DEFAULT_READER_DISPLAY_SETTINGS: ReaderDisplaySettings = {
  colorTheme: 'white',
  columnGap: 56,
  columnsPerPage: 2,
  enableKeyboardArrows: true,
  enableKeyboardLetters: true,
  enableReaderArrows: true,
  enableWheelNavigation: true,
  limitWheelToOnePage: true,
  fontFamily: READER_FONT_OPTIONS[0].value,
  fontLabel: READER_FONT_OPTIONS[0].label,
  fontSize: 12,
  fontWeight: 400,
  lineHeight: 1.78,
  margin: 36,
  textAlign: 'left',
}
