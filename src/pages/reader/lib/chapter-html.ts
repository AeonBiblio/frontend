import DOMPurify from 'dompurify'

import type { ReaderDisplaySettings } from '@modules/reader/model/display-settings'

const ALLOWED_TAGS = [
  'abbr',
  'article',
  'aside',
  'b',
  'blockquote',
  'body',
  'br',
  'chapter',
  'cite',
  'code',
  'dd',
  'del',
  'details',
  'dfn',
  'div',
  'dl',
  'dt',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'ins',
  'li',
  'main',
  'ol',
  'p',
  'pre',
  'q',
  's',
  'section',
  'small',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]
const ALLOWED_ATTR = ['colspan', 'rowspan', 'title']
const READER_BLOCK_TAGS = new Set([
  'ADDRESS',
  'ASIDE',
  'BLOCKQUOTE',
  'DETAILS',
  'DIV',
  'DL',
  'FIGURE',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HR',
  'LI',
  'OL',
  'P',
  'PRE',
  'TABLE',
  'UL',
])
const READER_CONTAINER_TAGS = new Set([
  'ARTICLE',
  'BODY',
  'CHAPTER',
  'MAIN',
  'SECTION',
])
const MAX_TEXT_BLOCK_LENGTH = 900

export function sanitizeChapterHtml(html: string) {
  if (typeof window === 'undefined') {
    const text = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return textToParagraphs(text).join('')
  }

  const sanitized = DOMPurify.sanitize(html, {
    ALLOW_DATA_ATTR: false,
    ALLOWED_ATTR,
    ALLOWED_TAGS,
    FORBID_ATTR: ['style'],
    FORBID_TAGS: [
      'audio',
      'canvas',
      'embed',
      'form',
      'iframe',
      'img',
      'input',
      'link',
      'meta',
      'object',
      'picture',
      'script',
      'source',
      'style',
      'svg',
      'video',
    ],
  })

  if (sanitized.trim()) {
    return sanitized
  }

  const text = new DOMParser().parseFromString(html, 'text/html').body
    .textContent

  return textToParagraphs(text).join('')
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function splitTextIntoChunks(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  const chunks: string[] = []
  let rest = normalized

  while (rest.length > MAX_TEXT_BLOCK_LENGTH) {
    const windowText = rest.slice(0, MAX_TEXT_BLOCK_LENGTH)
    const sentenceBreak = Math.max(
      windowText.lastIndexOf('. '),
      windowText.lastIndexOf('! '),
      windowText.lastIndexOf('? '),
      windowText.lastIndexOf('… '),
    )
    const whitespaceBreak = windowText.lastIndexOf(' ')
    const splitAt =
      sentenceBreak > MAX_TEXT_BLOCK_LENGTH * 0.45
        ? sentenceBreak + 1
        : whitespaceBreak > MAX_TEXT_BLOCK_LENGTH * 0.45
          ? whitespaceBreak
          : MAX_TEXT_BLOCK_LENGTH

    chunks.push(rest.slice(0, splitAt).trim())
    rest = rest.slice(splitAt).trim()
  }

  if (rest) {
    chunks.push(rest)
  }

  return chunks
}

function textToParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .flatMap((part) => splitTextIntoChunks(part))
    .filter(Boolean)
    .map((part) => `<p>${escapeHtml(part)}</p>`)
}

function isTextOnlyBlock(node: HTMLElement) {
  return Array.from(node.children).every(
    (child) => !READER_BLOCK_TAGS.has(child.tagName),
  )
}

export function createSettingsHash(settings: ReaderDisplaySettings) {
  return [
    settings.fontFamily,
    settings.fontSize,
    settings.fontWeight,
    settings.lineHeight,
    settings.margin,
    settings.columnGap,
    settings.columnsPerPage,
  ].join(':')
}

export function splitHtmlIntoBlocks(html: string) {
  if (typeof window === 'undefined') {
    return [html]
  }

  const document = new DOMParser().parseFromString(html, 'text/html')
  const blocks: string[] = []

  function collectNode(node: ChildNode) {
    if (node instanceof Text) {
      const text = node.textContent.trim()

      blocks.push(...textToParagraphs(text))

      return
    }

    if (!(node instanceof HTMLElement)) {
      return
    }

    const children = Array.from(node.childNodes)
    const shouldUnwrap =
      READER_CONTAINER_TAGS.has(node.tagName) ||
      (node.tagName === 'DIV' &&
        children.some(
          (child) =>
            child instanceof HTMLElement &&
            (READER_BLOCK_TAGS.has(child.tagName) ||
              READER_CONTAINER_TAGS.has(child.tagName)),
        ))

    if (shouldUnwrap) {
      children.forEach(collectNode)
      return
    }

    if (
      READER_BLOCK_TAGS.has(node.tagName) &&
      isTextOnlyBlock(node) &&
      node.textContent.trim().length > MAX_TEXT_BLOCK_LENGTH
    ) {
      blocks.push(...textToParagraphs(node.textContent))
      return
    }

    if (READER_BLOCK_TAGS.has(node.tagName)) {
      blocks.push(node.outerHTML)
      return
    }

    const text = node.textContent.trim()

    blocks.push(...textToParagraphs(text))
  }

  Array.from(document.body.childNodes).forEach(collectNode)

  return blocks.length > 0 ? blocks : [html]
}
