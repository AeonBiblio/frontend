import { useEffect, useLayoutEffect, useMemo, useState } from 'react'

import { splitHtmlIntoBlocks } from '../lib/chapter-html'

import type { RefObject } from 'react'
import type { ReaderDisplaySettings } from '@modules/reader/model/display-settings'

const TWO_PAGE_SPREAD_MIN_WIDTH = 900
const AVERAGE_CHAR_WIDTH_FACTOR = 0.52
const PAGE_VERTICAL_PADDING_EXTRA = 5

type UseChapterPaginationParams = {
  headingRef: RefObject<HTMLHeadingElement | null>
  html: string
  measureRef: RefObject<HTMLDivElement | null>
  progressKey: string
  settings: ReaderDisplaySettings
  viewportRef: RefObject<HTMLDivElement | null>
}

export function useChapterPagination({
  headingRef,
  html,
  measureRef,
  progressKey,
  settings,
  viewportRef,
}: UseChapterPaginationParams) {
  const [pageIndex, setPageIndex] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [pages, setPages] = useState<string[]>([])
  const [pagesPerSpread, setPagesPerSpread] = useState(1)
  const [contentMargin, setContentMargin] = useState(settings.margin)
  const [hasMeasuredPages, setHasMeasuredPages] = useState(false)
  const htmlBlocks = useMemo(() => splitHtmlIntoBlocks(html), [html])
  const measureHtml = useMemo(() => htmlBlocks.join(''), [htmlBlocks])
  const visiblePages = pages.slice(pageIndex, pageIndex + pagesPerSpread)
  const percentage = pageCount <= 1 ? 100 : (pageIndex / (pageCount - 1)) * 100
  const isAtLastSpread =
    hasMeasuredPages && pageIndex + pagesPerSpread >= pageCount

  useEffect(() => {
    setPageIndex(0)
    setPageCount(1)
    setPages([])
    setPagesPerSpread(1)
    setHasMeasuredPages(false)
  }, [progressKey])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const heading = headingRef.current
    const measure = measureRef.current

    if (!viewport || !heading || !measure) {
      return
    }

    let frameId: number | null = null

    const calculatePages = () => {
      const pageWidth = viewport.clientWidth
      const pageHeight = viewport.clientHeight

      if (pageWidth <= 0 || pageHeight <= 0) {
        return
      }

      const nextContentMargin =
        pageWidth < 700
          ? Math.min(settings.margin, 18)
          : Math.min(settings.margin, 42)
      const nextPagesPerSpread = pageWidth >= TWO_PAGE_SPREAD_MIN_WIDTH ? 2 : 1
      const spreadGap = nextPagesPerSpread === 2 ? settings.columnGap : 0
      const contentWidth = Math.max(
        1,
        (pageWidth - spreadGap) / nextPagesPerSpread,
      )
      const availableHeight = Math.max(
        1,
        pageHeight -
          heading.offsetHeight -
          (nextContentMargin + PAGE_VERTICAL_PADDING_EXTRA) * 2,
      )

      measure.style.width = `${contentWidth}px`

      const blockElements = Array.from(measure.children)
      const nextPages: string[] = []
      let currentBlocks: string[] = []
      let currentHeight = 0

      blockElements.forEach((block, index) => {
        const blockStyle =
          block instanceof HTMLElement ? window.getComputedStyle(block) : null
        const marginTop = blockStyle
          ? Number.parseFloat(blockStyle.marginTop) || 0
          : 0
        const marginBottom = blockStyle
          ? Number.parseFloat(blockStyle.marginBottom) || 0
          : 0
        const blockHeight =
          block instanceof HTMLElement
            ? block.offsetHeight + marginTop + marginBottom
            : 0
        const blockHtml = htmlBlocks[index]

        if (!blockHtml) {
          return
        }

        if (
          currentBlocks.length > 0 &&
          currentHeight + blockHeight > availableHeight
        ) {
          nextPages.push(currentBlocks.join(''))
          currentBlocks = []
          currentHeight = 0
        }

        currentBlocks.push(blockHtml)
        currentHeight += blockHeight
      })

      if (currentBlocks.length > 0) {
        nextPages.push(currentBlocks.join(''))
      }

      const estimatedPages = paginateBlocksByTextLength({
        availableHeight,
        contentWidth,
        htmlBlocks,
        lineHeight: settings.lineHeight,
        fontSize: settings.fontSize,
      })
      const shouldUseEstimatedPages =
        nextPages.length <= 1 && estimatedPages.length > nextPages.length
      const safePages = shouldUseEstimatedPages ? estimatedPages : nextPages
      const nextPageCount = safePages.length

      setContentMargin(nextContentMargin)
      setPages(safePages)
      setPagesPerSpread(nextPagesPerSpread)
      setPageCount(nextPageCount)
      setHasMeasuredPages(true)
      setPageIndex((value) => {
        const clampedValue = Math.min(value, nextPageCount - 1)

        return nextPagesPerSpread === 2
          ? clampedValue - (clampedValue % 2)
          : clampedValue
      })
    }

    const scheduleCalculatePages = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }

      frameId = window.requestAnimationFrame(calculatePages)
    }

    scheduleCalculatePages()

    const observer = new ResizeObserver(scheduleCalculatePages)
    const images = Array.from(measure.querySelectorAll('img'))

    observer.observe(viewport)
    observer.observe(measure)
    images.forEach((image) => {
      image.addEventListener('load', scheduleCalculatePages)
      image.addEventListener('error', scheduleCalculatePages)
    })

    return () => {
      observer.disconnect()
      images.forEach((image) => {
        image.removeEventListener('load', scheduleCalculatePages)
        image.removeEventListener('error', scheduleCalculatePages)
      })
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [
    headingRef,
    htmlBlocks,
    measureHtml,
    measureRef,
    settings.columnGap,
    settings.margin,
    progressKey,
    viewportRef,
  ])

  return {
    contentMargin,
    hasMeasuredPages,
    isAtLastSpread,
    measureHtml,
    pageCount,
    pageIndex,
    pagesPerSpread,
    percentage,
    setPageIndex,
    visiblePages,
  }
}

function getTextLength(html: string) {
  const document = new DOMParser().parseFromString(html, 'text/html')

  return document.body.textContent.replace(/\s+/g, ' ').trim().length
}

function paginateBlocksByTextLength({
  availableHeight,
  contentWidth,
  fontSize,
  htmlBlocks,
  lineHeight,
}: {
  availableHeight: number
  contentWidth: number
  fontSize: number
  htmlBlocks: string[]
  lineHeight: number
}) {
  const lineHeightPx = Math.max(1, fontSize * lineHeight)
  const linesPerPage = Math.max(1, Math.floor(availableHeight / lineHeightPx))
  const charsPerLine = Math.max(
    12,
    Math.floor(
      contentWidth / Math.max(1, fontSize * AVERAGE_CHAR_WIDTH_FACTOR),
    ),
  )
  const charsPerPage = Math.max(
    120,
    Math.floor(linesPerPage * charsPerLine * 0.88),
  )
  const pages: string[] = []
  let currentBlocks: string[] = []
  let currentLength = 0

  htmlBlocks.forEach((block) => {
    const blockLength = Math.max(1, getTextLength(block))

    if (
      currentBlocks.length > 0 &&
      currentLength + blockLength > charsPerPage
    ) {
      pages.push(currentBlocks.join(''))
      currentBlocks = []
      currentLength = 0
    }

    currentBlocks.push(block)
    currentLength += blockLength
  })

  if (currentBlocks.length > 0) {
    pages.push(currentBlocks.join(''))
  }

  return pages.length > 0 ? pages : ['']
}
