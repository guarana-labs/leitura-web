import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import type { DictccEntry } from '@/lib/dictionary/dictcc'
import { lookupDictcc } from '@/services/dictionaryService'
import { getUserWords, saveUserWord } from '@/services/wordService'
import type { UserWord, WordStatus } from '@/types/vocabulary'

const vocabularyKeys = {
  language: (userId: string, language: string) => ['vocabulary', userId, language] as const,
  words: (userId: string, language: string, words: string[]) =>
    [...vocabularyKeys.language(userId, language), 'words', words.join('|')] as const,
}

/** The user's marks for the words on the current page (missing = NEW). */
export function useUserWords(language: string, words: string[]) {
  const userId = useAuth().user?.id ?? null
  return useQuery<Map<string, UserWord>>({
    queryKey: vocabularyKeys.words(userId ?? 'anonymous', language, words),
    queryFn: () => getUserWords(language, words),
    enabled: userId !== null && words.length > 0,
    staleTime: 60_000,
  })
}

/**
 * Saves a word's status/meaning. The new value is applied to every cached page
 * right away (optimistic), so all occurrences recolor instantly.
 */
export function useSaveUserWord(language: string) {
  const userId = useAuth().user?.id ?? 'anonymous'
  const queryClient = useQueryClient()
  const languageKey = vocabularyKeys.language(userId, language)

  return useMutation({
    mutationFn: ({ word, value }: { word: string; value: { status: WordStatus; meaning: string | null } }) =>
      saveUserWord(language, word, value),
    onMutate: async ({ word, value }) => {
      await queryClient.cancelQueries({ queryKey: languageKey })
      const previous = queryClient.getQueriesData<Map<string, UserWord>>({ queryKey: languageKey })
      queryClient.setQueriesData<Map<string, UserWord>>({ queryKey: languageKey }, (current) => {
        if (!current) return current
        const next = new Map(current)
        next.set(word, value)
        return next
      })
      return { previous }
    },
    onError: (_error, _variables, context) => {
      // Put the previous colors back if saving failed.
      for (const [key, data] of context?.previous ?? []) queryClient.setQueryData(key, data)
    },
  })
}

/** dict.cc senses for one lookup key; the data never changes, so it's cached for the session. */
export function useDictcc(key: string, enabled: boolean) {
  return useQuery<DictccEntry[]>({
    queryKey: ['dictionary', 'dictcc-de-en', key],
    queryFn: () => lookupDictcc(key),
    enabled: enabled && key !== '',
    staleTime: Infinity,
    retry: 1,
  })
}
