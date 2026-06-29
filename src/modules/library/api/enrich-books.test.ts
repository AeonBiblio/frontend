import type { AxiosInstance } from 'axios'
import { describe, expect, it, vi } from 'vitest'

import { enrichBooks } from './enrich-books'

describe('enrichBooks', () => {
  it('returns empty map for empty ids', async () => {
    const client = { get: vi.fn() } as unknown as AxiosInstance
    const result = await enrichBooks(client, [])
    expect(result.size).toBe(0)
    expect(client.get).not.toHaveBeenCalled()
  })

  it('deduplicates book ids', async () => {
    const bookId = '550e8400-e29b-41d4-a716-446655440000'
    const client = {
      get: vi.fn().mockResolvedValue({
        data: {
          id: bookId,
          title: 'Test',
          author_id: '550e8400-e29b-41d4-a716-446655440001',
          description: null,
          cover_key: null,
          file_key: 'books/550e8400-e29b-41d4-a716-446655440000.epub',
          file_format: 'epub',
          file_size_bytes: 1024,
          status: 'published',
          is_in_subscription: false,
          subscription_payout_amount: null,
          is_for_sale: false,
          sale_price: null,
          rejection_reason: null,
          published_at: '2026-06-27T12:00:00Z',
          reader_processing_status: 'ready',
          reader_processing_error: null,
          reader_manifest_version: 2,
          created_at: '2026-06-27T12:00:00Z',
          updated_at: '2026-06-27T12:00:00Z',
          average_rating: null,
          ratings_count: 0,
          reviews_count: 0,
          my_rating: null,
        },
      }),
    } as unknown as AxiosInstance

    const result = await enrichBooks(client, [bookId, bookId])

    expect(client.get).toHaveBeenCalledTimes(1)
    expect(result.get(bookId)?.title).toBe('Test')
  })
})
