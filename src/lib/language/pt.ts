import type { Token } from '@/lib/language/types'
import { createProfile, tokenizeWords } from '@/lib/language/default'

/** Pronouns attached to verbs with a hyphen: "disse-lhe", "fazê-lo", "dá-se-lhe". */
const CLITICS = new Set([
  'me', 'te', 'se', 'nos', 'vos', 'lhe', 'lhes',
  'o', 'a', 'os', 'as', 'lo', 'la', 'los', 'las', 'no', 'na', 'nas',
  'mo', 'ma', 'mos', 'mas', 'to', 'ta', 'tos', 'tas', 'lho', 'lha', 'lhos', 'lhas',
])

/** Contractions with an apostrophe: "d'água", "n'alma". */
const ELISION = /^([dn])['’](.+)$/iu

/**
 * Portuguese: verb–pronoun forms are split so "disse-lhe" counts as "disse" + "lhe"
 * (otherwise every combination would be a separate word). Compound nouns like
 * "guarda-chuva" stay whole, because their second part isn't a pronoun.
 */
function tokenizePortuguese(text: string): Token[] {
  return tokenizeWords(text).flatMap((token) => (token.isWord ? splitWord(token.text) : [token]))
}

function splitWord(word: string): Token[] {
  const elision = word.match(ELISION)
  if (elision) {
    return [{ text: `${elision[1]}'`, isWord: true }, ...splitWord(elision[2])]
  }

  const parts = word.split('-')
  if (parts.length > 1 && parts.slice(1).every((part) => CLITICS.has(part.toLocaleLowerCase('pt')))) {
    return parts.flatMap((part, index) => [
      ...(index > 0 ? [{ text: '-', isWord: false }] : []),
      { text: part, isWord: true },
    ])
  }

  return [{ text: word, isWord: true }]
}

export const portugueseProfile = createProfile('pt-BR', { tokenize: tokenizePortuguese })
