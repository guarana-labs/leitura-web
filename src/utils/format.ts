import i18n from '@/lib/i18n'

/** Formatters follow the active UI language (pt-BR for now). */
function locale(): string {
  return i18n.language
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(locale()).format(value)
}

/** e.g. "20 de nov. de 2026" */
export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(isoDate),
  )
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
]

/** e.g. "há 2 dias", "agora" */
export function formatRelativeTime(isoDate: string, now: Date = new Date()): string {
  const seconds = Math.round((new Date(isoDate).getTime() - now.getTime()) / 1000)
  const formatter = new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' })

  for (const [unit, unitSeconds] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return formatter.format(Math.round(seconds / unitSeconds), unit)
    }
  }
  return formatter.format(0, 'second')
}

/** Reading progress as a whole percentage (0–100). */
export function progressPercent(currentPage: number | null, totalPages: number): number {
  if (!currentPage || totalPages <= 0) return 0
  return Math.min(100, Math.round((currentPage / totalPages) * 100))
}
