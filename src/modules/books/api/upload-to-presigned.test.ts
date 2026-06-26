import { afterEach, describe, expect, it, vi } from 'vitest'

import { putFileToPresignedUrl } from './upload-to-presigned'

describe('putFileToPresignedUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends PUT with file content type', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    const file = new File(['hello'], 'cover.png', { type: 'image/png' })

    await putFileToPresignedUrl(file, 'https://minio.test/upload')

    expect(fetchMock).toHaveBeenCalledWith('https://minio.test/upload', {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': 'image/png',
      },
    })
  })
})
