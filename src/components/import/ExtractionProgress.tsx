import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Progress } from '@/components/ui/progress'

interface ExtractionProgressProps {
  fileName: string
  /** 0 to 1. */
  progress: number
}

export function ExtractionProgress({ fileName, progress }: ExtractionProgressProps) {
  const { t } = useTranslation()
  const percent = Math.round(progress * 100)

  return (
    <div className="flex flex-col items-center rounded-lg border px-6 py-16 text-center" role="status">
      <LoaderCircle className="mb-4 size-6 animate-spin text-muted-foreground" aria-hidden />
      <h2 className="font-medium">{t('import.extracting.title')}</h2>
      <p className="mt-1 max-w-md truncate text-sm text-muted-foreground">{fileName}</p>
      <Progress value={percent} className="mt-6 h-1.5 w-full max-w-sm" />
      <p className="mt-2 font-mono text-xs text-muted-foreground tabular-nums">{percent}%</p>
    </div>
  )
}
