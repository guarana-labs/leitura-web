/** Widest an image is stored. Wider ones are scaled down; smaller ones keep their size. */
export const BOOK_IMAGE_MAX_WIDTH = 1200

/** Used when an SVG has no size of its own. */
const SVG_FALLBACK_WIDTH = 800

export interface PreparedImage {
  blob: Blob
  width: number
  height: number
  /** File extension matching the blob's format. */
  extension: 'webp' | 'png' | 'jpg'
}

/** Formats that may be stored as they are (the storage bucket accepts these). */
const STORABLE_TYPES: Record<string, PreparedImage['extension']> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

/**
 * Converts a book image (JPEG, PNG, GIF, WebP or SVG) to WebP, at most
 * BOOK_IMAGE_MAX_WIDTH wide. Browsers that can't encode WebP produce PNG instead.
 * Animated GIFs keep only their first frame. An original that's already small
 * enough, in a storable format and lighter than the conversion is kept as is.
 */
export async function prepareBookImage(file: Blob): Promise<PreparedImage> {
  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url)
    const originalExtension = STORABLE_TYPES[file.type]
    let width = image.naturalWidth
    let height = image.naturalHeight
    const fitsAsIs = width > 0 && width <= BOOK_IMAGE_MAX_WIDTH
    if (width === 0 || height === 0) {
      // An SVG without width/height: give it a sensible size, keeping its proportions when known.
      width = SVG_FALLBACK_WIDTH
      height = Math.round(SVG_FALLBACK_WIDTH * (image.height && image.width ? image.height / image.width : 0.75))
    }
    if (width > BOOK_IMAGE_MAX_WIDTH) {
      height = Math.round((height * BOOK_IMAGE_MAX_WIDTH) / width)
      width = BOOK_IMAGE_MAX_WIDTH
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is not supported')
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, width, height)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('Could not encode image'))), 'image/webp', 0.85)
    })
    if (originalExtension && fitsAsIs && file.size <= blob.size) {
      return { blob: file, width, height, extension: originalExtension }
    }
    return { blob, width, height, extension: blob.type === 'image/webp' ? 'webp' : 'png' }
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load image'))
    image.src = url
  })
}
