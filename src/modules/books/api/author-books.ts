import type { AxiosInstance } from 'axios'

import { bookOutSchema, uploadUrlOutSchema } from '@shared/api/core'
import type { BookOut, CreateBookBody } from '@shared/api/core'
import { bookOutToLocalBook } from '@shared/lib/db'

import { putFileToPresignedUrl } from './upload-to-presigned'

export type BookEditorFormData = {
  title: string
  description: string
  isInSubscription: boolean
  price: string
  genreTagIds: string[]
  bookFile?: File | null
  coverFile?: File | null
}

const SUPPORTED_BOOK_FORMATS = new Set(['epub', 'fb2', 'pdf'])

export function getBookFileFormat(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase()

  if (!extension || !SUPPORTED_BOOK_FORMATS.has(extension)) {
    throw new Error('Неподдерживаемый формат книги')
  }

  return extension
}

export function buildBookMetadata(
  data: Pick<
    BookEditorFormData,
    'title' | 'description' | 'isInSubscription' | 'price'
  >,
): CreateBookBody {
  const trimmedPrice = data.price.trim()
  const hasPrice = trimmedPrice.length > 0

  let salePrice: string | null = null

  if (hasPrice) {
    const normalized = trimmedPrice.replace(',', '.')
    const amount = Number.parseFloat(normalized)

    if (Number.isNaN(amount) || amount < 0) {
      throw new Error('Некорректная цена')
    }

    salePrice = amount.toFixed(2)
  }

  return {
    title: data.title.trim(),
    description: data.description.trim() || undefined,
    is_in_subscription: data.isInSubscription,
    is_for_sale: hasPrice,
    sale_price: hasPrice ? salePrice : null,
  }
}

async function persistBookLocally(book: BookOut) {
  const [{ bookRepository }, localBook] = await Promise.all([
    import('@domain/repositories'),
    Promise.resolve(bookOutToLocalBook(book)),
  ])

  await bookRepository.save(localBook)
}

export async function uploadCover(
  client: AxiosInstance,
  bookId: string,
  file: File,
): Promise<void> {
  const uploadResponse = await client.post(`/books/${bookId}/cover`)
  const upload = uploadUrlOutSchema.parse(uploadResponse.data)

  await putFileToPresignedUrl(file, upload.upload_url)
  await client.patch(`/books/${bookId}/cover-key`, null, {
    params: { object_key: upload.object_key },
  })
}

export async function uploadBookFile(
  client: AxiosInstance,
  bookId: string,
  file: File,
): Promise<void> {
  const fileFormat = getBookFileFormat(file.name)
  const uploadResponse = await client.post(`/books/${bookId}/file`, null, {
    params: { file_format: fileFormat },
  })
  const upload = uploadUrlOutSchema.parse(uploadResponse.data)

  await putFileToPresignedUrl(file, upload.upload_url)
  await client.patch(`/books/${bookId}/file-key`, null, {
    params: {
      object_key: upload.object_key,
      file_format: fileFormat,
      file_size_bytes: file.size,
    },
  })
}

async function setGenreTags(
  client: AxiosInstance,
  bookId: string,
  genreTagIds: string[],
) {
  if (genreTagIds.length === 0) {
    return
  }

  await client.put(`/books/${bookId}/genre-tags`, {
    genre_tag_ids: genreTagIds,
  })
}

export async function publishBook(
  client: AxiosInstance,
  data: BookEditorFormData,
): Promise<BookOut> {
  const metadata = buildBookMetadata(data)
  const createResponse = await client.post('/books', metadata)
  const created = bookOutSchema.parse(createResponse.data)
  const bookId = created.id

  if (data.coverFile) {
    await uploadCover(client, bookId, data.coverFile)
  }

  if (!data.bookFile) {
    throw new Error('Файл книги обязателен для публикации')
  }

  await uploadBookFile(client, bookId, data.bookFile)
  await setGenreTags(client, bookId, data.genreTagIds)

  const publishResponse = await client.post(`/books/${bookId}/publish`)
  const published = bookOutSchema.parse(publishResponse.data)

  await persistBookLocally(published)

  return published
}

export async function saveBook(
  client: AxiosInstance,
  bookId: string,
  data: BookEditorFormData,
): Promise<BookOut> {
  const metadata = buildBookMetadata(data)

  await client.patch(`/books/${bookId}`, metadata)

  if (data.coverFile) {
    await uploadCover(client, bookId, data.coverFile)
  }

  if (data.bookFile) {
    await uploadBookFile(client, bookId, data.bookFile)
  }

  await setGenreTags(client, bookId, data.genreTagIds)

  const bookResponse = await client.get(`/books/${bookId}`)
  const updated = bookOutSchema.parse(bookResponse.data)

  await persistBookLocally(updated)

  return updated
}
