import { Palette } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { READER_THEMES, isReaderThemeId, type ReaderThemeId } from '@/lib/readerThemes'

interface ReaderThemeMenuProps {
  value: ReaderThemeId
  onChange: (theme: ReaderThemeId) => void
}

/** Colour theme choice for reading; each option shows a small preview of its page and text. */
export function ReaderThemeMenu({ value, onChange }: ReaderThemeMenuProps) {
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('reader.themes.label')} title={t('reader.themes.label')}>
          <Palette aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {t('reader.themes.label')}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => {
            if (isReaderThemeId(next)) onChange(next)
          }}
        >
          {READER_THEMES.map((theme) => (
            <DropdownMenuRadioItem key={theme.id} value={theme.id} className="gap-3 py-2">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-md border font-serif text-sm"
                style={{ backgroundColor: theme.swatch, color: theme.ink }}
                aria-hidden
              >
                Aa
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm">{t(theme.labelKey)}</span>
                <span className="text-xs text-muted-foreground">{t(theme.hintKey)}</span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
