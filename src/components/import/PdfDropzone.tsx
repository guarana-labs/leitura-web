import { useRef, useState, type DragEvent } from 'react'
import { FileUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PdfDropzoneProps {
  onFile: (file: File) => void
}

/** Drag-and-drop area (or file picker) for choosing a PDF. */
export function PdfDropzone({ onFile }: PdfDropzoneProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center rounded-lg border border-dashed px-6 py-16 text-center transition-colors',
        isDragging && 'border-ring bg-ring/5',
      )}
    >
      <div className="mb-4 flex size-11 items-center justify-center rounded-xl border bg-card">
        <FileUp className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <h2 className="font-medium">{t('import.dropzone.title')}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t('import.dropzone.description')}</p>
      <Button className="mt-6" onClick={() => inputRef.current?.click()}>
        {t('import.dropzone.choose')}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFile(file)
          event.target.value = ''
        }}
      />
    </div>
  )
}
