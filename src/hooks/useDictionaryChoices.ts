import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { resolveDictionary } from '@/lib/dictionary/dictionaries'
import { getDictionaryChoices, saveDictionaryChoice } from '@/services/dictionaryChoiceService'

const choicesKey = (userId: string) => ['dictionaryChoices', userId] as const

/** [dictionary branch only] The user's dictionary per book language (language → dictionary id). */
export function useDictionaryChoices() {
  const userId = useAuth().user?.id ?? null
  return useQuery<Map<string, string>>({
    queryKey: choicesKey(userId ?? 'anonymous'),
    queryFn: getDictionaryChoices,
    enabled: userId !== null,
    // Only changed from this app, which updates the cache itself.
    staleTime: Infinity,
  })
}

/** The dictionary to use for a book language (the user's choice or the default); null if there's none. */
export function useChosenDictionary(language: string) {
  const choices = useDictionaryChoices()
  return {
    dictionary: resolveDictionary(language, choices.data?.get(language)),
    isPending: choices.isPending,
  }
}

/** Saves a language's dictionary; the choice applies right away (optimistic). */
export function useSaveDictionaryChoice() {
  const userId = useAuth().user?.id ?? 'anonymous'
  const queryClient = useQueryClient()
  const key = choicesKey(userId)

  return useMutation({
    mutationFn: ({ language, dictionary }: { language: string; dictionary: string }) =>
      saveDictionaryChoice(language, dictionary),
    onMutate: async ({ language, dictionary }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Map<string, string>>(key)
      queryClient.setQueryData<Map<string, string>>(key, (current) => new Map(current).set(language, dictionary))
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
  })
}
