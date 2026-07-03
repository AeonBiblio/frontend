import { apiClient } from '@shared/api/client/api-client'
import type { LocalOutboxItem } from '@shared/lib/db'
import type { Method } from 'axios'

import { outboxRepository } from '../domain/outbox-repository'
import { OUTBOX_EVENTS_PATH, toOutboxEvent } from './outbox-event'
import { reconcileDeliveredHttpOutboxItem } from './reconcile-http-outbox-item'

type LegacyReaderRequest = {
  data?: unknown
  method: Method
  url: string
}

function legacyReaderEventToRequest(
  item: LocalOutboxItem,
): LegacyReaderRequest | null {
  if (item.type === 'progress.update') {
    return {
      url: `/books/${item.payload.bookId}/reader/progress`,
      method: 'put',
      data: {
        chapter_id: item.payload.chapterId,
        chapter_index: item.payload.chapterIndex,
        chapter_offset: item.payload.chapterOffset,
        page_index: item.payload.pageIndex,
        page_count: item.payload.pageCount,
        percentage: item.payload.percentage,
        cfi: item.payload.cfi,
        settings_hash: item.payload.settingsHash,
        updated_at: item.payload.updatedAt,
      },
    }
  }

  if (item.type === 'reader-settings.update') {
    return {
      url: `/books/${item.payload.bookId}/reader/settings`,
      method: 'put',
      data: {
        theme: item.payload.theme,
        font_family: item.payload.fontFamily,
        font_size: item.payload.fontSize,
        font_weight: item.payload.fontWeight,
        line_height: item.payload.lineHeight,
        page_mode: item.payload.pageMode,
        text_align: item.payload.textAlign,
        margin: item.payload.margin,
        column_gap: item.payload.columnGap,
        columns_per_page: item.payload.columnsPerPage,
        enable_keyboard_arrows: item.payload.enableKeyboardArrows,
        enable_keyboard_letters: item.payload.enableKeyboardLetters,
        enable_reader_arrows: item.payload.enableReaderArrows,
        enable_wheel_navigation: item.payload.enableWheelNavigation,
        limit_wheel_to_one_page: item.payload.limitWheelToOnePage,
        updated_at: item.payload.updatedAt,
      },
    }
  }

  if (item.type === 'annotation.create' || item.type === 'annotation.update') {
    return {
      url: `/books/${item.payload.bookId}/reader/annotations/${item.payload.id}`,
      method: 'put',
      data: {
        id: item.payload.id,
        chapter_id: item.payload.chapterId,
        chapter_index: item.payload.chapterIndex,
        type: item.payload.type,
        page_index: item.payload.pageIndex,
        page_number: item.payload.pageNumber,
        page_count: item.payload.pageCount,
        percentage: item.payload.percentage,
        settings_hash: item.payload.settingsHash,
        range: item.payload.range,
        quote: item.payload.quote,
        color: item.payload.color,
        text: item.payload.text,
        note: item.payload.note,
        created_at: item.payload.createdAt,
        updated_at: item.payload.updatedAt,
        deleted_at: item.payload.deletedAt,
      },
    }
  }

  if (item.type === 'annotation.delete') {
    return {
      url: `/books/${item.bookId}/reader/annotations/${item.payload.id}`,
      method: 'delete',
    }
  }

  return null
}

export async function deliverViaHttp(item: LocalOutboxItem) {
  if (item.type === 'http.request') {
    const response = await apiClient.request({
      url: item.payload.path,
      method: item.payload.method,
      data: item.payload.body,
      headers: {
        'Idempotency-Key': item.idempotencyKey,
      },
    })

    await reconcileDeliveredHttpOutboxItem(item, response.data)
    await outboxRepository.remove(item.id)
    return
  }

  const legacyReaderRequest = legacyReaderEventToRequest(item)

  if (legacyReaderRequest) {
    await apiClient.request({
      ...legacyReaderRequest,
      headers: {
        'Idempotency-Key': item.idempotencyKey,
      },
    })

    await outboxRepository.remove(item.id)
    return
  }

  const event = toOutboxEvent(item)

  await apiClient.post(OUTBOX_EVENTS_PATH, event, {
    headers: {
      'Idempotency-Key': item.idempotencyKey,
    },
  })

  await outboxRepository.remove(item.id)
}
