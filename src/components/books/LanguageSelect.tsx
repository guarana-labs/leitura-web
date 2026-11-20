import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BOOK_LANGUAGES, OTHER_LANGUAGE, translatedLanguageName, type BookLanguage } from '@/lib/languages'

interface LanguageSelectProps {
  id?: string
  value: BookLanguage
  onChange: (value: BookLanguage) => void
}

/** Book language picker: native name first, the UI-language name as a muted hint. */
export function LanguageSelect({ id, value, onChange }: LanguageSelectProps) {
  const { t, i18n } = useTranslation()

  return (
    <Select value={value} onValueChange={(next) => onChange(next as BookLanguage)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {BOOK_LANGUAGES.map((language) => {
          const translated = translatedLanguageName(language.code, i18n.language)
          return (
            <SelectItem key={language.code} value={language.code}>
              <span lang={language.code}>{language.nativeName}</span>
              {translated && <span className="text-xs text-muted-foreground">{translated}</span>}
            </SelectItem>
          )
        })}
        <SelectItem value={OTHER_LANGUAGE}>{t('languages.other')}</SelectItem>
      </SelectContent>
    </Select>
  )
}
