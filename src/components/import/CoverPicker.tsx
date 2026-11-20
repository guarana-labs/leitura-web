import { useEffect, useMemo, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BookCover } from '@/components/books/BookCover'
import { CoverCropDialog } from '@/components/import/CoverCropDialog'
import { Button } from '@/components/ui/button'

interface CoverPickerProps {
  title: string
  cover: Blob | null
  onChange: (cover: Blob | null) => void
}

/** Optional cover: pick an image, crop it to 2:3, preview it. */
export function CoverPicker({ title, cover, onChange }: CoverPickerProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const previewUrl = useMemo(() => (cover ? URL.createObjectURL(cover) : null), [cover])

  // Object URLs must be released, or the images stay in memory.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    }
  }, [sourceUrl])

  return (
    <div className="flex items-end gap-4">
      <BookCover title={title} url={previewUrl} className="w-24" />
      <div className="flex flex-col gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <ImagePlus aria-hidden />
          {cover ? t('import.cover.change') : t('import.cover.add')}
        </Button>
        {cover && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            <X aria-hidden />
            {t('import.cover.remove')}
          </Button>
        )}
        <p className="text-xs text-muted-foreground">{t('import.cover.hint')}</p>
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
          onChange(blob)
          setSourceUrl(null)
        }}
      />
    </div>
  )
}
