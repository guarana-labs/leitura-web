import { BOOK_IMAGES_BUCKET, supabase } from '@/lib/supabase'
import { prepareBookImage } from '@/utils/bookImage'

/** How long a signed image URL stays valid. The reader asks for new ones before they expire. */
export const IMAGE_URL_TTL_SECONDS = 60 * 60

/** Images converted and uploaded at the same time. */
const PARALLEL_UPLOADS = 4

/** Attempts per upload, so a short network hiccup doesn't fail a whole import. */
const UPLOAD_ATTEMPTS = 3

export interface StoredImage {
  path: string
  width: number
  height: number
}

export interface UploadedImages {
  /** Stored file for each image key that worked. */
  stored: Map<string, StoredImage>
  /** Keys of images that couldn't be read (a broken or unsupported file). They're left out of the book. */
  unreadable: string[]
}

/** Reports image upload progress: how many are done out of the total. */
export type ImageProgressCallback = (done: number, total: number) => void

/**
 * Converts and uploads a book's images to "<user_id>/<book_id>/<n>.webp".
 * An image that can't be read is skipped; an upload that keeps failing (e.g. the
 * connection dropped) removes what was already uploaded and throws.
 */
export async function uploadBookImages(
  bookId: string,
  images: Map<string, Blob>,
  onProgress?: ImageProgressCallback,
): Promise<UploadedImages> {
  const folder = await bookFolder(bookId)
  const entries = [...images]
  const stored = new Map<string, StoredImage>()
  const unreadable: string[] = []
  let next = 0
  let done = 0
  onProgress?.(0, entries.length)

  async function worker() {
    while (next < entries.length) {
      const index = next++
      const [key, file] = entries[index]
      const prepared = await prepareBookImage(file).catch(() => null)
      if (prepared) {
        const path = `${folder}/${index + 1}.${prepared.extension}`
        await uploadWithRetry(path, prepared.blob)
        stored.set(key, { path, width: prepared.width, height: prepared.height })
      } else {
        unreadable.push(key)
      }
      onProgress?.(++done, entries.length)
    }
  }

  try {
    await Promise.all(Array.from({ length: Math.min(PARALLEL_UPLOADS, entries.length) }, worker))
  } catch (error) {
    await removeBookImages(bookId).catch(() => undefined)
    throw error
  }
  return { stored, unreadable }
}

async function uploadWithRetry(path: string, blob: Blob): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    const { error } = await supabase.storage.from(BOOK_IMAGES_BUCKET).upload(path, blob, { contentType: blob.type })
    if (!error) return
    if (attempt >= UPLOAD_ATTEMPTS) throw error
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt))
  }
}

/** Creates signed URLs for many images in a single request. Paths that fail are simply missing. */
export async function getBookImageUrls(paths: string[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>()
  if (paths.length === 0) return urls

  const { data, error } = await supabase.storage
    .from(BOOK_IMAGES_BUCKET)
    .createSignedUrls(paths, IMAGE_URL_TTL_SECONDS)
  if (error) throw error

  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) urls.set(item.path, item.signedUrl)
  }
  return urls
}

/** Removes every image of a book (its whole folder). */
export async function removeBookImages(bookId: string): Promise<void> {
  const folder = await bookFolder(bookId)
  const bucket = supabase.storage.from(BOOK_IMAGES_BUCKET)

  // Listing returns at most `limit` files, so list and remove until the folder is empty.
  for (;;) {
    const { data, error } = await bucket.list(folder, { limit: 1000 })
    if (error) throw error
    if (data.length === 0) return
    const { data: removed, error: removeError } = await bucket.remove(data.map((file) => `${folder}/${file.name}`))
    if (removeError) throw removeError
    // Nothing removed (e.g. no permission): stop instead of listing the same files forever.
    if (removed.length === 0) return
  }
}

/** Storage policies only allow touching files inside the user's own folder. */
async function bookFolder(bookId: string): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user.id
  if (!userId) throw new Error('Not authenticated')
  return `${userId}/${bookId}`
}
