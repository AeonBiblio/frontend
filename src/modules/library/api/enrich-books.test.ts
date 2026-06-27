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
          status: 'published',
          is_in_subscription: false,
          is_for_sale: false,
          ratings_count: 0,
          reviews_count: 0,
        },
      }),
    } as unknown as AxiosInstance

    const result = await enrichBooks(client, [bookId, bookId])

    expect(client.get).toHaveBeenCalledTimes(1)
    expect(result.get(bookId)?.title).toBe('Test')
  })
})
