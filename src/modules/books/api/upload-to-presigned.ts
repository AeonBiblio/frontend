export async function putFileToPresignedUrl(
  file: File,
  url: string,
): Promise<void> {
  const response = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`)
  }
}
