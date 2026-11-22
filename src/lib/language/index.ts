import { createProfile, defaultProfile } from '@/lib/language/default'
import { germanProfile } from '@/lib/language/de'
import { portugueseProfile } from '@/lib/language/pt'
import type { LanguageProfile } from '@/lib/language/types'

export type { LanguageProfile, Token } from '@/lib/language/types'

/** English needs nothing special: the default rules keep contractions ("don't") whole. */
const englishProfile = createProfile('en')

const PROFILES: Record<string, LanguageProfile> = {
  de: germanProfile,
  'pt-BR': portugueseProfile,
  en: englishProfile,
}

/** Older codes still found in stored books ('pt' became 'pt-BR'). */
const ALIASES: Record<string, string> = { pt: 'pt-BR' }

/** The rules for a book's language; unknown codes and "other" use the default rules. */
export function getLanguageProfile(code: string | null): LanguageProfile {
  const canonical = code ? (ALIASES[code] ?? code) : null
  return (canonical && PROFILES[canonical]) || defaultProfile
}
