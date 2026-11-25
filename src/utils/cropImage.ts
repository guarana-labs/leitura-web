export interface PixelCrop {
  x: number
  y: number
  width: number
  height: number
}

/** Final cover size: 2:3, large enough to look sharp, small enough to stay ~50–150 KB. */
export const COVER_WIDTH = 600
export const COVER_HEIGHT = 900

/** Crops an image to `crop` and returns it as a 600×900 WebP blob. */
export async function cropToCover(imageUrl: string, crop: PixelCrop): Promise<Blob> {
  const image = await loadImage(imageUrl)
  const canvas = document.createElement('canvas')
  canvas.width = COVER_WIDTH
  canvas.height = COVER_HEIGHT

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not supported')
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, COVER_WIDTH, COVER_HEIGHT)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))), 'image/webp', 0.85)
  })
}

/**
 * Turns a book's own cover image into a cover: the largest centered 2:3 area,
 * as a 600×900 WebP. Covers are usually close to 2:3, so little or nothing is cut.
 */
export async function coverFromImage(file: Blob): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const { naturalWidth: width, naturalHeight: height } = await loadImage(url)
    if (!width || !height) throw new Error('Image has no size')
    const targetRatio = COVER_WIDTH / COVER_HEIGHT
    const cropWidth = Math.min(width, height * targetRatio)
    const cropHeight = cropWidth / targetRatio
    const crop = { x: (width - cropWidth) / 2, y: (height - cropHeight) / 2, width: cropWidth, height: cropHeight }
    return await cropToCover(url, crop)
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
