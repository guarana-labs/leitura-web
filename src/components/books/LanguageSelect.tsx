import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BOOK_LANGUAGES, OTHER_LANGUAGE, type BookLanguage } from '@/lib/languages'

interface LanguageSelectProps {
  id?: string
  value: BookLanguage
  onChange: (value: BookLanguage) => void
}

/** Book language picker: each language by its own name, with its flag. */
export function LanguageSelect({ id, value, onChange }: LanguageSelectProps) {
  const { t } = useTranslation()

  return (
    <Select value={value} onValueChange={(next) => onChange(next as BookLanguage)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {BOOK_LANGUAGES.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            <img src={language.flag} alt="" className="size-5 shrink-0 rounded-full ring-1 ring-border" />
            <span lang={language.code}>{language.nativeName}</span>
          </SelectItem>
        ))}
        <SelectItem value={OTHER_LANGUAGE}>
          <span className="flex size-5 shrink-0 items-center justify-center" aria-hidden>
            <Globe className="size-4 text-muted-foreground" />
          </span>
          {t('languages.other')}
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
