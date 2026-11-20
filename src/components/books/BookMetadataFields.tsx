import { useTranslation } from 'react-i18next'
import { LanguageSelect } from '@/components/books/LanguageSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { BookLanguage } from '@/lib/languages'

export interface BookMetadataValues {
  title: string
  author: string
  language: BookLanguage
  description: string
}

interface BookMetadataFieldsProps {
  /** Prefix for input ids, so two forms can share a page. */
  idPrefix: string
  values: BookMetadataValues
  onChange: (changes: Partial<BookMetadataValues>) => void
  /** Show validation messages (after a submit attempt). */
  showErrors: boolean
}

// Must match the length checks in the `books` table.
const MAX_TITLE = 500
const MAX_AUTHOR = 300
const MAX_DESCRIPTION = 5000

/** Title, author, language and description: shared by the import and edit forms. */
export function BookMetadataFields({ idPrefix, values, onChange, showErrors }: BookMetadataFieldsProps) {
  const { t } = useTranslation()
  const titleMissing = values.title.trim() === ''

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-title`}>{t('bookForm.title')}</Label>
        <Input
          id={`${idPrefix}-title`}
          value={values.title}
          onChange={(event) => onChange({ title: event.target.value })}
          aria-invalid={showErrors && titleMissing}
          maxLength={MAX_TITLE}
          required
        />
        {showErrors && titleMissing && <p className="text-xs text-destructive">{t('bookForm.titleRequired')}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-author`}>
          {t('bookForm.author')} <span className="text-muted-foreground">{t('common.optional')}</span>
        </Label>
        <Input
          id={`${idPrefix}-author`}
          value={values.author}
          onChange={(event) => onChange({ author: event.target.value })}
          maxLength={MAX_AUTHOR}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-language`}>{t('bookForm.language')}</Label>
        <LanguageSelect
          id={`${idPrefix}-language`}
          value={values.language}
          onChange={(language) => onChange({ language })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-description`}>
          {t('bookForm.description')} <span className="text-muted-foreground">{t('common.optional')}</span>
        </Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={values.description}
          onChange={(event) => onChange({ description: event.target.value })}
          maxLength={MAX_DESCRIPTION}
          rows={4}
        />
      </div>
    </>
  )
}
