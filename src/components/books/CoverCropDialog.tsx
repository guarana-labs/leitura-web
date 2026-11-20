import { useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { cropToCover } from '@/utils/cropImage'

interface CoverCropDialogProps {
  /** Object URL of the chosen image; the dialog is open while set. */
  imageUrl: string | null
  onCancel: () => void
  onConfirm: (cover: Blob) => void
}

/** Lets the user position and zoom an image inside a 2:3 frame. */
export function CoverCropDialog({ imageUrl, onCancel, onConfirm }: CoverCropDialogProps) {
  const { t } = useTranslation()
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasError, setHasError] = useState(false)

  async function handleConfirm() {
    if (!imageUrl || !croppedArea) return
    setIsSaving(true)
    setHasError(false)
    try {
      onConfirm(await cropToCover(imageUrl, croppedArea))
      setZoom(1)
      setCrop({ x: 0, y: 0 })
    } catch {
      setHasError(true)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={imageUrl !== null} onOpenChange={(open) => !open && !isSaving && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('bookForm.cover.cropTitle')}</DialogTitle>
          <DialogDescription>{t('bookForm.cover.cropDescription')}</DialogDescription>
        </DialogHeader>

        <div className="relative mx-auto aspect-[2/3] w-full max-w-64 overflow-hidden rounded-md bg-muted">
          {imageUrl && (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={2 / 3}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_area, areaPixels) => setCroppedArea(areaPixels)}
            />
          )}
        </div>

        <Slider
          value={[zoom]}
          min={1}
          max={3}
          step={0.05}
          onValueChange={([value]) => setZoom(value)}
          aria-label={t('bookForm.cover.zoom')}
        />

        {hasError && (
          <p role="alert" className="text-sm text-destructive">
            {t('bookForm.cover.error')}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={isSaving || !croppedArea}>
            {isSaving && <LoaderCircle className="animate-spin" aria-hidden />}
            {t('bookForm.cover.apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
