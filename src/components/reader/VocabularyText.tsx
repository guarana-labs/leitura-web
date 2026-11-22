import { useCallback, useMemo, useRef, useState } from 'react'
import { MeaningHint } from '@/components/reader/MeaningHint'
import { ReaderPageView, type ClickedWord } from '@/components/reader/ReaderPageView'
import { WordPanel } from '@/components/reader/WordPanel'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { useSaveUserWord, useUserWords } from '@/hooks/useVocabulary'
import { getLanguageProfile } from '@/lib/language'

interface VocabularyTextProps {
  /** The book's language code (null/unknown use the default rules). */
  language: string | null
  paragraphs: string[]
  fontSize: number
  fontFamily: string
  isLastPage: boolean
}

/**
 * A page of text where every word shows its status (new / familiar / learned /
 * ignored) and opens a box with the status, dictionary and the user's meaning.
 */
export function VocabularyText({ language, paragraphs, fontSize, fontFamily, isLastPage }: VocabularyTextProps) {
  const profile = getLanguageProfile(language)
  const languageCode = profile.code

  const tokenized = useMemo(() => paragraphs.map((paragraph) => profile.tokenize(paragraph)), [paragraphs, profile])
  // Every distinct word on the page, in a stable order (so the cache key is stable too).
  const pageWords = useMemo(() => {
    const keys = new Set<string>()
    for (const tokens of tokenized) {
      for (const token of tokens) if (token.isWord) keys.add(profile.normalize(token.text))
    }
    return [...keys].sort()
  }, [tokenized, profile])

  const userWords = useUserWords(languageCode, pageWords)
  const saveWord = useSaveUserWord(languageCode)

  const [selected, setSelected] = useState<ClickedWord | null>(null)
  // The popover follows the clicked word on the page (also while scrolling).
  const anchorRef = useRef<{ getBoundingClientRect: () => DOMRect }>({
    getBoundingClientRect: () => new DOMRect(),
  })

  function handleWordClick(word: ClickedWord) {
    anchorRef.current = { getBoundingClientRect: () => word.element.getBoundingClientRect() }
    setSelected(word)
  }

  // Hovering a word with a saved meaning shows that meaning above it (whatever its status).
  const [hovered, setHovered] = useState<ClickedWord | null>(null)
  const hoveredMeaning = hovered ? userWords.data?.get(hovered.key)?.meaning : null
  // Not needed for the word whose box is open: the box already shows the meaning.
  const showHint = hovered !== null && !!hoveredMeaning && hovered.key !== selected?.key
  const dismissHint = useCallback(() => setHovered(null), [])

  return (
    <Popover open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
      <PopoverAnchor virtualRef={anchorRef} />
      <ReaderPageView
        paragraphs={tokenized}
        normalize={profile.normalize}
        userWords={userWords.data}
        selectedKey={selected?.key ?? null}
        onWordClick={handleWordClick}
        onWordHover={setHovered}
        fontSize={fontSize}
        fontFamily={fontFamily}
        isLastPage={isLastPage}
      />
      <MeaningHint
        element={showHint ? hovered.element : null}
        meaning={hoveredMeaning ?? ''}
        onDismiss={dismissHint}
      />
      <PopoverContent
        className="max-h-[min(32rem,70svh)] w-80 overflow-y-auto"
        collisionPadding={12}
        onPointerDownOutside={(event) => {
          // A click on another word switches the box to that word in one click,
          // instead of first closing it (which made a second click necessary).
          const target = event.detail.originalEvent.target as Element | null
          if (target?.closest('[data-word]')) event.preventDefault()
        }}
        onOpenAutoFocus={(event) => {
          // Focus the box itself (not the first button), so keys 1–4 work right away.
          event.preventDefault()
          ;(event.currentTarget as HTMLElement | null)?.focus()
        }}
      >
        {selected && (
          <WordPanel
            // A new word starts with a fresh panel (meaning field, dictionary lookup).
            key={selected.key}
            word={selected.text}
            profile={profile}
            userWord={userWords.data?.get(selected.key)}
            isSaving={saveWord.isPending}
            onSave={(value) => saveWord.mutate({ word: selected.key, value })}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
