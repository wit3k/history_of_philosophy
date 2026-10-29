import type { DateAccuracy } from '../data/dto/Person'

/** Positive modulo (JS `%` keeps the sign of the dividend). */
export const mod = (n: number, m: number) => ((n % m) + m) % m

/** Timeline / UI label: -367 → "367 p.n.e.", 1677 → "1677". */
export const formatYear = (year: number): string => (year < 0 ? `${Math.abs(year)} p.n.e.` : `${year}`)

export const formatYearRange = (from: number, to: number | null | undefined): string => {
  if (to == null || to === from) return formatYear(from)
  return `${formatYear(from)}–${formatYear(to)}`
}

const DATE_ACCURACY_VALUES: DateAccuracy[] = [
  'godziny',
  'dni',
  'tygodnie',
  'miesiące',
  'lata',
  'dekady',
  'stulecia',
]

export const parseDateAccuracy = (raw: unknown): DateAccuracy | null => {
  if (typeof raw !== 'string') return null
  return (DATE_ACCURACY_VALUES as string[]).includes(raw) ? (raw as DateAccuracy) : null
}

/** Short Polish label next to a year, e.g. "dokł. dni". */
export const formatDateAccuracy = (accuracy: DateAccuracy | null | undefined): string | null => {
  if (!accuracy) return null
  return `dokł. ${accuracy}`
}

/** Coarser than a year → treat date as approximate on the diagram. */
export const isApproximateAccuracy = (accuracy: DateAccuracy | null | undefined): boolean =>
  accuracy === 'lata' || accuracy === 'dekady' || accuracy === 'stulecia'

/**
 * NocoDB date bug: years in -99..99 get stored as ±30xx (e.g. 50 → 3050, -50 → -3050).
 */
export const unhackNocoYear = (year: number): number => {
  if (year >= 3000 && year <= 3099) return year - 3000
  if (year <= -3000 && year >= -3099) return year + 3000
  return year
}
