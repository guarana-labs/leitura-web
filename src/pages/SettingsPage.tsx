import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { DictionaryDirection } from '@/components/dictionary/DictionaryDirection'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDictionaryChoices, useSaveDictionaryChoice } from '@/hooks/useDictionaryChoices'
import { DICTIONARY_LANGUAGES, dictionariesFor, resolveDictionary } from '@/lib/dictionary/dictionaries'
import { BOOK_LANGUAGES } from '@/lib/languages'

/** [dictionary branch only] Account preferences: for now, the dictionary per book language. */
export function SettingsPage() {
  const { t } = useTranslation()
  const choices = useDictionaryChoices()
  const saveChoice = useSaveDictionaryChoice()

  function choose(language: string, dictionary: string) {
    saveChoice.mutate(
      { language, dictionary },
      {
        onSuccess: () => toast.success(t('settings.dictionaries.saved')),
        onError: () => toast.error(t('settings.dictionaries.saveFailed')),
      },
    )
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title={t('settings.title')} description={t('settings.subtitle')} />

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.dictionaries.title')}</CardTitle>
          <CardDescription>{t('settings.dictionaries.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {DICTIONARY_LANGUAGES.map((language) => {
            const info = BOOK_LANGUAGES.find((item) => item.code === language)
            const selected = resolveDictionary(language, choices.data?.get(language))?.id
            const labelId = `dictionary-language-${language}`
            return (
              <div key={language} className="flex flex-col gap-2">
                <div id={labelId} className="flex items-center gap-2 text-sm font-medium">
                  {info && <img src={info.flag} alt="" className="size-5 shrink-0 rounded-full ring-1 ring-border" />}
                  {t('settings.dictionaries.label', { language: info?.nativeName ?? language })}
                </div>

                {choices.isPending ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div role="radiogroup" aria-labelledby={labelId} className="grid gap-2 sm:grid-cols-2">
                    {dictionariesFor(language).map((dictionary) => {
                      const isSelected = dictionary.id === selected
                      return (
                        <button
                          key={dictionary.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => !isSelected && choose(language, dictionary.id)}
                          className={cn(
                            'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring',
                            isSelected && 'border-foreground/30 bg-muted/50',
                          )}
                        >
                          <span className="flex w-full items-center gap-2">
                            <span className="font-medium">{t(`dictionaries.${dictionary.id}.name`)}</span>
                            <span className="text-xs text-muted-foreground">
                              <DictionaryDirection dictionary={dictionary} />
                            </span>
                            {isSelected && <Check className="ml-auto size-4 shrink-0" aria-hidden />}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t(`dictionaries.${dictionary.id}.description`)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
