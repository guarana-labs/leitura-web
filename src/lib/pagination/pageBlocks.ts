/** A page's content in reading order: its paragraphs with the images placed between them. */
export type PageBlock<Image> = { type: 'text'; text: string } | { type: 'image'; image: Image }

/** Puts each image before the paragraph its `before` index points to (images past the last paragraph go at the end). */
export function pageBlocks<Image extends { before: number }>(paragraphs: string[], images: Image[]): PageBlock<Image>[] {
  const blocks: PageBlock<Image>[] = []
  const imagesBefore = (index: number) =>
    images.filter((image) => image.before === index).map((image) => ({ type: 'image' as const, image }))

  for (const [index, text] of paragraphs.entries()) {
    blocks.push(...imagesBefore(index), { type: 'text', text })
  }
  for (const image of images) if (image.before >= paragraphs.length) blocks.push({ type: 'image', image })
  return blocks
}
