import { useEffect, useRef } from 'react'

import { isEditableTarget } from '@shared/lib/dom/is-editable-target'

import type { RefObject } from 'react'
import type { ReaderDisplaySettings } from '@domain/reader/display-settings'

const WHEEL_PAGE_THRESHOLD = 48
const WHEEL_PAGE_LOCK_MS = 420

type UseReaderInputNavigationParams = {
  goNextPage: () => void
  goPreviousPage: () => void
  isHudHidden: boolean
  onShowHud: () => void
  settings: ReaderDisplaySettings
  viewportRef: RefObject<HTMLDivElement | null>
}

export function useReaderInputNavigation({
  goNextPage,
  goPreviousPage,
  isHudHidden,
  onShowHud,
  settings,
  viewportRef,
}: UseReaderInputNavigationParams) {
  const wheelDeltaRef = useRef(0)
  const wheelLockedUntilRef = useRef(0)

  useEffect(() => {
    if (!settings.enableKeyboardArrows && !settings.enableKeyboardLetters) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isEditableTarget(event.target)) {
        return
      }

      const key = event.key.toLowerCase()

      if (isHudHidden && event.key === 'Escape') {
        event.preventDefault()
        onShowHud()
        return
      }

      const isPreviousArrow =
        settings.enableKeyboardArrows && event.key === 'ArrowLeft'
      const isNextArrow =
        settings.enableKeyboardArrows && event.key === 'ArrowRight'
      const isPreviousLetter = settings.enableKeyboardLetters && key === 'a'
      const isNextLetter = settings.enableKeyboardLetters && key === 'd'

      if (isPreviousArrow || isPreviousLetter) {
        event.preventDefault()
        goPreviousPage()
        return
      }

      if (isNextArrow || isNextLetter) {
        event.preventDefault()
        goNextPage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    goNextPage,
    goPreviousPage,
    isHudHidden,
    onShowHud,
    settings.enableKeyboardArrows,
    settings.enableKeyboardLetters,
  ])

  useEffect(() => {
    const viewport = viewportRef.current

    if (!viewport || !settings.enableWheelNavigation) {
      return
    }

    const handleWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || Math.abs(event.deltaY) < 1) {
        return
      }

      event.preventDefault()

      const now = Date.now()

      if (settings.limitWheelToOnePage && now < wheelLockedUntilRef.current) {
        return
      }

      wheelDeltaRef.current += event.deltaY

      if (Math.abs(wheelDeltaRef.current) < WHEEL_PAGE_THRESHOLD) {
        return
      }

      if (wheelDeltaRef.current > 0) {
        goNextPage()
      } else {
        goPreviousPage()
      }

      wheelDeltaRef.current = 0

      if (settings.limitWheelToOnePage) {
        wheelLockedUntilRef.current = now + WHEEL_PAGE_LOCK_MS
      }
    }

    viewport.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      viewport.removeEventListener('wheel', handleWheel)
      wheelDeltaRef.current = 0
    }
  }, [
    goNextPage,
    goPreviousPage,
    settings.enableWheelNavigation,
    settings.limitWheelToOnePage,
    viewportRef,
  ])
}
