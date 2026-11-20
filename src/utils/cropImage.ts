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

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load image'))
    image.src = url
  })
}
