const PDF_DIR = 'pdf-books'

export const PDF_OPFS_DIR = PDF_DIR
export const PDF_CHUNK_SIZE = 1024 * 1024

async function getPdfDir() {
  const root = await navigator.storage.getDirectory()
  return root.getDirectoryHandle(PDF_DIR, { create: true })
}

async function getPdfFileHandle(bookId: string, create = true) {
  const dir = await getPdfDir()

  return dir.getFileHandle(`${bookId}.pdf`, {
    create,
  })
}

export function getPdfOpfsPath(bookId: string) {
  return `/${PDF_DIR}/${bookId}.pdf`
}

export async function hasLocalPdf(bookId: string) {
  try {
    const handle = await getPdfFileHandle(bookId, false)
    const file = await handle.getFile()

    return file.size > 0
  } catch {
    return false
  }
}

export async function getLocalPdfFile(bookId: string) {
  const handle = await getPdfFileHandle(bookId, false)
  return handle.getFile()
}

export async function getLocalPdfObjectUrl(bookId: string) {
  const file = await getLocalPdfFile(bookId)
  return URL.createObjectURL(file)
}

export async function getLocalPdfSize(bookId: string) {
  const file = await getLocalPdfFile(bookId)

  return file.size
}

export async function removeLocalPdf(bookId: string) {
  const dir = await getPdfDir()

  await dir.removeEntry(`${bookId}.pdf`)
}

export async function writePdfToOpfs(
  bookId: string,
  fileSizeBytes: number,
  writeChunks: (writable: FileSystemWritableFileStream) => Promise<void>,
) {
  const handle = await getPdfFileHandle(bookId, true)
  const writable = await handle.createWritable()

  try {
    await writable.write({
      type: 'truncate',
      size: fileSizeBytes,
    })

    await writeChunks(writable)
    await writable.close()
  } catch (error) {
    await writable.abort()
    throw error
  }
}
