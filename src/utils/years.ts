import type { DateAccuracy } from '../data/dto/Person'

/** Positive modulo (JS `%` keeps the sign of the dividend). */
export const mod = (n: number, m: number) => ((n % m) + m) % m

/** Timeline / UI label: -367 → "367 p.n.e.", 1677 → "1677". */
export const formatYear = (year: number): string => (year < 0 ? `${Math.abs(year)} p.n.e.` : `${year}`)

const monthLengths = (leap: boolean) =>
  leap ? [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] : [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const isLeapYear = (year: number) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)

/** Playhead label. Fractional years are a day within that year, not "1677.0833". */
export const formatPlayhead = (year: number): string => {
  if (!Number.isFinite(year)) return ''
  const base = Math.floor(year)
  const leap = isLeapYear(base)
  const length = leap ? 366 : 365
  let dayIndex = Math.min(length - 1, Math.max(0, Math.floor((year - base) * length + 1e-9)))
  const months = monthLengths(leap)
  let month = 0
  while (month < 11 && dayIndex >= months[month]) {
    dayIndex -= months[month]
    month += 1
  }
  const yyyy = `${base < 0 ? '-' : ''}${String(Math.abs(base)).padStart(4, '0')}`
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(dayIndex + 1).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

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
