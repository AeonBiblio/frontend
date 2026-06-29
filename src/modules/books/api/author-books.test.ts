import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AxiosInstance } from 'axios'

import { buildBookMetadata, publishBook, saveBook } from './author-books'

vi.mock('@domain/repositories', () => ({
  bookRepository: {
    save: vi.fn(async () => undefined),
  },
}))

describe('buildBookMetadata', () => {
  it('formats sale_price and enables sale when price is provided', () => {
    expect(
      buildBookMetadata({
        title: ' Test ',
        description: 'Desc',
        isInSubscription: true,
        price: '123',
      }),
    ).toEqual({
      title: 'Test',
      description: 'Desc',
      is_in_subscription: true,
      is_for_sale: true,
      sale_price: '123.00',
    })
  })

  it('disables sale when price is empty', () => {
    expect(
      buildBookMetadata({
        title: 'Book',
        description: '',
        isInSubscription: false,
        price: '   ',
      }),
    ).toEqual({
      title: 'Book',
      description: undefined,
      is_in_subscription: false,
      is_for_sale: false,
      sale_price: null,
    })
  })
})

describe('publishBook', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('calls endpoints in publish order', async () => {
    const calls: string[] = []
    const bookId = '550e8400-e29b-41d4-a716-446655440000'

    const client = {
      post: vi.fn(async (url: string) => {
        calls.push(`POST ${url}`)

        if (url === '/books') {
          return {
            data: {
              id: bookId,
              author_id: '660e8400-e29b-41d4-a716-446655440001',
              title: 'Book',
              description: null,
              cover_key: null,
              file_key: null,
              file_format: null,
              file_size_bytes: null,
              status: 'draft',
              is_in_subscription: false,
              subscription_payout_amount: null,
              is_for_sale: false,
              sale_price: null,
              rejection_reason: null,
              published_at: null,
              reader_processing_status: 'none',
              reader_processing_error: null,
              reader_manifest_version: 0,
              average_rating: null,
              ratings_count: 0,
              reviews_count: 0,
              my_rating: null,
              created_at: '2026-06-26T00:00:00Z',
              updated_at: '2026-06-26T00:00:00Z',
            },
          }
        }

        if (url === `/books/${bookId}/cover`) {
          return {
            data: {
              upload_url: 'https://minio.test/cover',
              object_key: `covers/${bookId}.jpg`,
            },
          }
        }

        if (url === `/books/${bookId}/file`) {
          return {
            data: {
              upload_url: 'https://minio.test/book',
              object_key: `books/${bookId}.epub`,
            },
          }
        }

        if (url === `/books/${bookId}/publish`) {
          return {
            data: {
              id: bookId,
              author_id: '660e8400-e29b-41d4-a716-446655440001',
              title: 'Book',
              description: null,
              cover_key: `covers/${bookId}.jpg`,
              file_key: `books/${bookId}.epub`,
              file_format: 'epub',
              file_size_bytes: 12,
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
              average_rating: null,
              ratings_count: 0,
              reviews_count: 0,
              my_rating: null,
              created_at: '2026-06-26T00:00:00Z',
              updated_at: '2026-06-26T00:00:00Z',
            },
          }
        }

        throw new Error(`Unexpected POST ${url}`)
      }),
      put: vi.fn(async (url: string) => {
        calls.push(`PUT ${url}`)
        return { data: [] }
      }),
      patch: vi.fn(async (url: string) => {
        calls.push(`PATCH ${url}`)
        return { data: {} }
      }),
      get: vi.fn(),
    } as unknown as AxiosInstance

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true })),
    )

    await publishBook(client, {
      title: 'Book',
      description: '',
      isInSubscription: false,
      price: '',
      genreTagIds: ['770e8400-e29b-41d4-a716-446655440002'],
      bookFile: new File(['content'], 'book.epub', {
        type: 'application/epub+zip',
      }),
      coverFile: new File(['cover'], 'cover.png', { type: 'image/png' }),
    })

    expect(calls).toEqual([
      'POST /books',
      'POST /books/550e8400-e29b-41d4-a716-446655440000/cover',
      'PATCH /books/550e8400-e29b-41d4-a716-446655440000/cover-key',
      'POST /books/550e8400-e29b-41d4-a716-446655440000/file',
      'PATCH /books/550e8400-e29b-41d4-a716-446655440000/file-key',
      'PUT /books/550e8400-e29b-41d4-a716-446655440000/genre-tags',
      'POST /books/550e8400-e29b-41d4-a716-446655440000/publish',
    ])
  })
})

describe('saveBook', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('does not create or publish the book', async () => {
    const bookId = '550e8400-e29b-41d4-a716-446655440000'
    const post = vi.fn()
    const client = {
      post,
      patch: vi.fn(async () => ({ data: {} })),
      put: vi.fn(async () => ({ data: [] })),
      get: vi.fn(async () => ({
        data: {
          id: bookId,
          author_id: '660e8400-e29b-41d4-a716-446655440001',
          title: 'Book',
          description: 'Updated',
          cover_key: null,
          file_key: null,
          file_format: null,
          file_size_bytes: null,
          status: 'draft',
          is_in_subscription: true,
          subscription_payout_amount: null,
          is_for_sale: true,
          sale_price: '99.00',
          rejection_reason: null,
          published_at: null,
          reader_processing_status: 'none',
          reader_processing_error: null,
          reader_manifest_version: 0,
          average_rating: null,
          ratings_count: 0,
          reviews_count: 0,
          my_rating: null,
          created_at: '2026-06-26T00:00:00Z',
          updated_at: '2026-06-26T00:00:00Z',
        },
      })),
    } as unknown as AxiosInstance

    await saveBook(client, bookId, {
      title: 'Book',
      description: 'Updated',
      isInSubscription: true,
      price: '99',
      genreTagIds: ['770e8400-e29b-41d4-a716-446655440002'],
    })

    expect(post).not.toHaveBeenCalled()
  })
})
