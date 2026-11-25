import { useEffect, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BookCover } from '@/components/books/BookCover'
import { CoverCropDialog } from '@/components/books/CoverCropDialog'
import { Button } from '@/components/ui/button'
import { useObjectUrl } from '@/hooks/useObjectUrl'

/**
 * What the cover should be after saving:
 * - existing: keep the cover the book already has (shown from its URL)
 * - new: replace it with a freshly cropped image
 * - none: no cover (or remove the current one)
 */
export type CoverState = { type: 'existing'; url: string } | { type: 'new'; blob: Blob } | { type: 'none' }

interface CoverPickerProps {
  title: string
  value: CoverState
  onChange: (value: CoverState) => void
}

/** Optional cover: pick an image, crop it to 2:3, preview it. */
export function CoverPicker({ title, value, onChange }: CoverPickerProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)

  const blobUrl = useObjectUrl(value.type === 'new' ? value.blob : null)
  const previewUrl = value.type === 'existing' ? value.url : blobUrl

  // Object URLs must be released, or the images stay in memory.
  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    }
  }, [sourceUrl])

  const hasCover = value.type !== 'none'

  return (
    <div className="flex items-end gap-4">
      <BookCover title={title} url={previewUrl} className="w-24" />
      <div className="flex flex-col gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <ImagePlus aria-hidden />
          {hasCover ? t('bookForm.cover.change') : t('bookForm.cover.add')}
        </Button>
        {hasCover && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ type: 'none' })}>
            <X aria-hidden />
            {t('bookForm.cover.remove')}
          </Button>
        )}
        <p className="text-xs text-muted-foreground">{t('bookForm.cover.hint')}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) setSourceUrl(URL.createObjectURL(file))
          event.target.value = ''
        }}
      />

      <CoverCropDialog
        imageUrl={sourceUrl}
        onCancel={() => setSourceUrl(null)}
        onConfirm={(blob) => {
          onChange({ type: 'new', blob })
          setSourceUrl(null)
        }}
      />
    </div>
  )
}
