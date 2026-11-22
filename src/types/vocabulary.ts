/** How well the user knows a word. Words never marked are "new". */
export type WordStatus = 'new' | 'familiar' | 'learned' | 'ignored'

export const WORD_STATUSES: WordStatus[] = ['new', 'familiar', 'learned', 'ignored']

/** A word the user has marked (status and/or their own meaning). */
export interface UserWord {
  status: WordStatus
  meaning: string | null
}
