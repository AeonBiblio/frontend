import type { LocalBookAsset } from '@shared/lib/db'
import type { ReaderDisplaySettings } from '@modules/reader/model/display-settings'

export type ResolvedChapterAsset = {
  asset: LocalBookAsset
  objectUrl: string
}

const ASSET_ATTRS = ['src', 'href', 'xlink:href'] as const
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
  'IMG',
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

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function normalizeRef(value: string) {
  return decodeURIComponent(value).split('#')[0].split('?')[0]
}

function basename(value: string) {
  return normalizeRef(value).split('/').filter(Boolean).at(-1) ?? value
}

function createAssetMatchers(asset: LocalBookAsset) {
  const values = [asset.id, asset.href, asset.key, asset.url]
    .filter((value): value is string => Boolean(value))
    .map(normalizeRef)

  return new Set([...values, ...values.map(basename)])
}

function resolveAssetUrl(value: string, assets: ResolvedChapterAsset[]) {
  const normalized = normalizeRef(value)
  const normalizedBase = basename(normalized)

  for (const item of assets) {
    const matchers = createAssetMatchers(item.asset)

    if (matchers.has(normalized) || matchers.has(normalizedBase)) {
      return item.objectUrl
    }
  }

  return null
}

export function rewriteHtmlAssets(
  html: string,
  assets: ResolvedChapterAsset[],
) {
  if (assets.length === 0 || typeof window === 'undefined') {
    return html
  }

  const document = new DOMParser().parseFromString(html, 'text/html')

  document
    .querySelectorAll<HTMLElement>('[src], [href], [xlink\\:href]')
    .forEach((node) => {
      ASSET_ATTRS.forEach((attr) => {
        const value = node.getAttribute(attr)

        if (!value) {
          return
        }

        const resolved = resolveAssetUrl(value, assets)

        if (resolved) {
          node.setAttribute(attr, resolved)
        }
      })
    })

  return document.body.innerHTML
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

      if (text) {
        blocks.push(`<p>${escapeHtml(text)}</p>`)
      }

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

    if (READER_BLOCK_TAGS.has(node.tagName)) {
      blocks.push(node.outerHTML)
      return
    }

    const text = node.textContent.trim()

    if (text) {
      blocks.push(`<p>${escapeHtml(text)}</p>`)
    }
  }

  Array.from(document.body.childNodes).forEach(collectNode)

  return blocks.length > 0 ? blocks : [html]
}
