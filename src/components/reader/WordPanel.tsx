import { useEffect, useRef, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DictccSection } from '@/components/reader/DictccSection'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { LanguageProfile } from '@/lib/language'
import { cn } from '@/lib/utils'
import { WORD_STATUSES, type UserWord, type WordStatus } from '@/types/vocabulary'

const STATUS_DOTS: Record<WordStatus, string> = {
  new: 'bg-sky-500',
  familiar: 'bg-amber-400',
  learned: 'bg-emerald-500',
  ignored: 'bg-muted-foreground/50',
}

interface WordPanelProps {
  /** The word as written on the page. */
  word: string
  profile: LanguageProfile
  /** The user's current mark; undefined means NEW. */
  userWord: UserWord | undefined
  /** Status changes (buttons or keys 1–4); the box stays open. */
  onSave: (value: { status: WordStatus; meaning: string | null }) => void
  /** "Salvar significado"; the box closes once it's saved. */
  onSaveMeaning: (value: { status: WordStatus; meaning: string | null }) => void
  isSaving: boolean
}

/** Box shown for a clicked word: status buttons (keys 1–4), dictionary and the user's own meaning. */
export function WordPanel({ word, profile, userWord, onSave, onSaveMeaning, isSaving }: WordPanelProps) {
  const { t } = useTranslation()
  const status = userWord?.status ?? 'new'
  const savedMeaning = userWord?.meaning ?? ''
  const [meaning, setMeaning] = useState(savedMeaning)

  function setStatus(next: WordStatus) {
    onSave({ status: next, meaning: savedMeaning || null })
  }

  // Keys 1–4 set the status while the panel is open (listened on the window, so it
  // works wherever focus is), except while typing in a text field.
  const setStatusRef = useRef(setStatus)
  useEffect(() => {
    setStatusRef.current = setStatus
  })
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      if ((event.target as HTMLElement | null)?.closest('input, textarea, [contenteditable="true"]')) return
      const index = Number(event.key) - 1
      if (Number.isInteger(index) && index >= 0 && index < WORD_STATUSES.length) {
        event.preventDefault()
        setStatusRef.current(WORD_STATUSES[index])
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg font-semibold tracking-tight" lang={profile.code === 'other' ? undefined : profile.code}>
        {word}
      </p>

      {/* Status */}
      <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label={t('vocabulary.status')}>
        {WORD_STATUSES.map((item, index) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={item === status ? 'secondary' : 'ghost'}
            role="radio"
            aria-checked={item === status}
            onClick={() => setStatus(item)}
            className={cn('justify-start gap-2', item === status && 'ring-1 ring-border')}
          >
            <span className={cn('size-2 rounded-full', STATUS_DOTS[item])} aria-hidden />
            <span className="flex-1 text-left">{t(`vocabulary.statuses.${item}`)}</span>
            <kbd className="font-mono text-[10px] text-muted-foreground">{index + 1}</kbd>
          </Button>
        ))}
      </div>

      {/* Dictionary: dict.cc is German→English, so it's only offered for German books. */}
      {profile.code === 'de' ? (
        <DictccSection word={word} wordKey={profile.normalize(word)} />
      ) : (
        <p className="border-t pt-3 text-xs text-muted-foreground">{t('vocabulary.dictcc.germanOnly')}</p>
      )}

      {/* The user's own meaning */}
      <section className="flex flex-col gap-2 border-t pt-3">
        <label htmlFor="word-meaning" className="text-xs font-medium text-muted-foreground">
          {t('vocabulary.myMeaning')}
        </label>
        <Textarea
          id="word-meaning"
          value={meaning}
          onChange={(event) => setMeaning(event.target.value)}
          placeholder={t('vocabulary.myMeaningPlaceholder')}
          maxLength={2000}
          rows={2}
          className="min-h-16 text-sm"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="self-end"
          disabled={isSaving || meaning.trim() === savedMeaning.trim()}
          onClick={() => onSaveMeaning({ status, meaning: meaning.trim() || null })}
        >
          {isSaving && <LoaderCircle className="animate-spin" aria-hidden />}
          {t('vocabulary.saveMeaning')}
        </Button>
      </section>
    </div>
  )
}
