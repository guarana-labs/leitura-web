import { LayoutGrid, List } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { LibraryView } from '@/hooks/useLibraryView'
import { cn } from '@/lib/utils'

interface LibraryViewToggleProps {
  value: LibraryView
  onChange: (view: LibraryView) => void
}

const OPTIONS = [
  { view: 'list', icon: List, labelKey: 'dashboard.view.list' },
  { view: 'grid', icon: LayoutGrid, labelKey: 'dashboard.view.grid' },
] as const

/** Two-button switch between the list and grid views of the library. */
export function LibraryViewToggle({ value, onChange }: LibraryViewToggleProps) {
  const { t } = useTranslation()

  return (
    <div role="group" aria-label={t('dashboard.view.label')} className="flex items-center gap-0.5 rounded-lg border p-0.5">
      {OPTIONS.map(({ view, icon: Icon, labelKey }) => {
        const isActive = value === view
        return (
          <Button
            key={view}
            variant="ghost"
            size="icon-sm"
            aria-pressed={isActive}
            aria-label={t(labelKey)}
            title={t(labelKey)}
            onClick={() => onChange(view)}
            className={cn(isActive ? 'bg-muted text-foreground' : 'text-muted-foreground')}
          >
            <Icon aria-hidden />
          </Button>
        )
      })}
    </div>
  )
}
