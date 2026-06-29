const PDF_DIR = 'pdf-books'

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
