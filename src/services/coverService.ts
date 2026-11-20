import { COVERS_BUCKET, supabase } from '@/lib/supabase'

/** How long a signed cover URL stays valid. */
const SIGNED_URL_TTL_SECONDS = 60 * 60

/**
 * Creates signed URLs for many covers in a single request.
 * Returns a map of storage path → URL; paths that fail are simply missing.
 */
export async function getCoverUrls(paths: string[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>()
  if (paths.length === 0) return urls

  const { data, error } = await supabase.storage.from(COVERS_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL_SECONDS)
  if (error) throw error

  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) urls.set(item.path, item.signedUrl)
  }
  return urls
}

/**
 * Uploads a cover image and returns its storage path.
 * Each upload gets a new file name, so a replaced cover is never served from a stale cache.
 */
export async function uploadCover(bookId: string, cover: Blob): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id
  if (!userId) throw new Error('Not authenticated')

  // Storage policies only allow writing inside the user's own folder.
  const path = `${userId}/${bookId}-${Date.now()}.webp`
  const { error } = await supabase.storage.from(COVERS_BUCKET).upload(path, cover, { contentType: 'image/webp' })
  if (error) throw error
  return path
}

export async function removeCover(path: string): Promise<void> {
  const { error } = await supabase.storage.from(COVERS_BUCKET).remove([path])
  if (error) throw error
}
