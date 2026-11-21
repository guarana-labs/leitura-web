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
import { READER_FONTS, isReaderFontId, readerFontFamily, type ReaderFontId } from '@/lib/readerFonts'

interface ReaderFontMenuProps {
  value: ReaderFontId
  onChange: (font: ReaderFontId) => void
}

/** "Aa" button that opens the font choice; each option is shown in its own font. */
export function ReaderFontMenu({ value, onChange }: ReaderFontMenuProps) {
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('reader.fonts.label')}
          title={t('reader.fonts.label')}
          style={{ fontFamily: readerFontFamily(value) }}
          className="text-sm"
        >
          Aa
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {t('reader.fonts.label')}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => {
            if (isReaderFontId(next)) onChange(next)
          }}
        >
          {READER_FONTS.map((font) => (
            <DropdownMenuRadioItem key={font.id} value={font.id} className="py-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-base" style={{ fontFamily: font.family }}>
                  {font.name}
                </span>
                <span className="text-xs text-muted-foreground">{t(font.hintKey)}</span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
