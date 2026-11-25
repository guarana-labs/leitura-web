import { OPS, type PDFPageProxy } from 'pdfjs-dist'
import type { PdfImage } from '@/lib/pdf/extractBook'

/**
 * Finds the pictures drawn on a PDF page and where they are.
 *
 * A PDF page has no <img> tags: it's a list of drawing operations. Images are
 * drawn into a 1×1 square that the current transform stretches and moves into
 * place, so following the transform operations gives each image's position.
 *
 * Simple rules (to be improved from real books):
 * - Only bitmap images; vector drawings (charts made of lines) aren't seen.
 * - Images smaller than MIN_IMAGE_PIXELS on either side (dots, rules, spacers) are skipped.
 * - An image drawn on several pages (the same PDF object) is stored once.
 */

/** Smaller images are ornaments or spacers, not pictures. */
const MIN_IMAGE_PIXELS = 48

type Matrix = [number, number, number, number, number, number]

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0]

/** `current × next`: what a PDF `cm` operation does to the current transform. */
function multiply(m: Matrix, n: number[]): Matrix {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ]
}

/** The highest point (in PDF units, measured from the bottom of the page) of the unit square under `m`. */
function topOfUnitSquare(m: Matrix): number {
  return Math.max(m[5], m[1] + m[5], m[3] + m[5], m[1] + m[3] + m[5])
}

/** A decoded image as pdf.js hands it over. */
interface PdfImageData {
  width: number
  height: number
  /** Set when the browser could decode it directly. */
  bitmap?: ImageBitmap
  /** Raw pixels otherwise, in the format given by `kind`. */
  data?: Uint8Array | Uint8ClampedArray
  kind?: number
}

/** pdf.js' ImageKind values. */
const GRAYSCALE_1BPP = 1
const RGB_24BPP = 2
const RGBA_32BPP = 3

/**
 * Returns the page's images, top of the page first, and adds each image file to
 * `files` (by key) the first time it's seen. A page whose images can't be read
 * returns no images rather than failing the import.
 */
export async function readPageImages(page: PDFPageProxy, pageNumber: number, files: Map<string, Blob>): Promise<PdfImage[]> {
  try {
    const { fnArray, argsArray } = await page.getOperatorList()
    const drawn: { source: string | PdfImageData; top: number; key: string }[] = []
    const stack: Matrix[] = []
    let transform = IDENTITY

    for (const [index, fn] of fnArray.entries()) {
      const args = argsArray[index]
      switch (fn) {
        case OPS.save:
          stack.push(transform)
          break
        case OPS.restore:
          transform = stack.pop() ?? transform
          break
        case OPS.transform:
          transform = multiply(transform, args)
          break
        case OPS.paintFormXObjectBegin:
          // A form is a reusable group of operations with its own transform; pdf.js saves around it.
          stack.push(transform)
          if (args[0]) transform = multiply(transform, args[0])
          break
        case OPS.paintFormXObjectEnd:
          transform = stack.pop() ?? transform
          break
        case OPS.paintImageXObject: {
          const id: string = args[0]
          // Images shared across pages ("g_…") get one key for the whole book.
          drawn.push({ source: id, top: topOfUnitSquare(transform), key: id.startsWith('g_') ? id : `${pageNumber}/${id}` })
          break
        }
        case OPS.paintInlineImageXObject:
          drawn.push({ source: args[0], top: topOfUnitSquare(transform), key: `${pageNumber}/inline-${index}` })
          break
      }
    }

    const images: PdfImage[] = []
    for (const { source, top, key } of drawn) {
      const image = typeof source === 'string' ? await getObject(page, source) : source
      if (!image || image.width < MIN_IMAGE_PIXELS || image.height < MIN_IMAGE_PIXELS) continue
      if (!files.has(key)) {
        const blob = await toBlob(image)
        if (!blob) continue
        files.set(key, blob)
      }
      images.push({ file: key, top, width: image.width, height: image.height })
    }
    return images.sort((a, b) => b.top - a.top)
  } catch {
    return []
  }
}

function getObject(page: PDFPageProxy, id: string): Promise<PdfImageData | null> {
  const objects = id.startsWith('g_') ? page.commonObjs : page.objs
  return new Promise((resolve) => objects.get(id, resolve, () => resolve(null)))
}

/** Draws a decoded PDF image onto a canvas and encodes it as PNG (it's converted to WebP later, on upload). */
async function toBlob(image: PdfImageData): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext('2d')
  if (!context) return null

  if (image.bitmap) {
    context.drawImage(image.bitmap, 0, 0)
  } else {
    const pixels = toRgba(image)
    if (!pixels) return null
    context.putImageData(new ImageData(pixels, image.width, image.height), 0, 0)
  }
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

/** Converts pdf.js' raw pixel formats to the RGBA layout a canvas expects. */
function toRgba({ width, height, data, kind }: PdfImageData): Uint8ClampedArray<ArrayBuffer> | null {
  if (!data) return null
  const rgba = new Uint8ClampedArray(width * height * 4)

  if (kind === RGBA_32BPP) {
    rgba.set(data.subarray(0, rgba.length))
  } else if (kind === RGB_24BPP) {
    for (let source = 0, target = 0; target < rgba.length; source += 3, target += 4) {
      rgba[target] = data[source]
      rgba[target + 1] = data[source + 1]
      rgba[target + 2] = data[source + 2]
      rgba[target + 3] = 255
    }
  } else if (kind === GRAYSCALE_1BPP) {
    // One bit per pixel, each row padded to a whole byte; 1 is white.
    const rowBytes = Math.ceil(width / 8)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const white = (data[y * rowBytes + (x >> 3)] >> (7 - (x & 7))) & 1
        const target = (y * width + x) * 4
        rgba[target] = rgba[target + 1] = rgba[target + 2] = white ? 255 : 0
        rgba[target + 3] = 255
      }
    }
  } else {
    return null
  }
  return rgba
}
