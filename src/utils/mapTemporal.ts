import type Location from '../data/dto/Location'
import type Person from '../data/dto/Person'
import type PersonHistoryEvent from '../data/dto/PersonHistoryEvent'
import ColorsService from '../services/Colors'
import type { LifePoint, PersonLifePath } from './lifePaths'

export const ECHO_YEARS = 200
export const FADE_START_YEARS = 200
export const FADE_END_YEARS = 400
export const ECHO_OPACITY = 0.35
/** Years advanced per second while playback is in a content-dense region (at 1×). */
export const DENSE_YEARS_PER_SECOND = 15
/** Max wall-clock seconds to traverse a contiguous empty year span (at 1×). */
export const EMPTY_SPAN_MAX_SECONDS = 5
/** Playback speed multipliers offered in the scrubber. */
export const PLAYBACK_SPEED_STEPS = [0.03125, 0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8] as const
export type PlaybackSpeed = (typeof PLAYBACK_SPEED_STEPS)[number]

export type TemporalMode = 'range' | 'playhead'

export type TemporalState = {
  year: number
  yearFrom: number
  yearTo: number
  mode: TemporalMode
}

export type AvatarWaypoint = {
  lat: number
  lng: number
  year: number
  kind: 'birth' | 'personal' | 'death'
  label: string
}

export type PersonAvatarTrack = {
  personId: string
  name: string
  accent: string
  thumbnail: string | null
  born: number
  died: number
  stillAlive: boolean
  waypoints: AvatarWaypoint[]
}

export type AvatarPosition = {
  lat: number
  lng: number
  opacity: number
}

function locCoords(locationsById: Map<string, Location>, id: string | number | null | undefined) {
  if (id == null || id === '') return null
  const loc = locationsById.get(String(id))
  if (!loc) return null
  const { x: lat, y: lng } = loc.coordinates
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng, name: loc.name }
}

export function collectionLifespanSpan(people: Person[]): { yearFrom: number; yearTo: number } | null {
  if (people.length === 0) return null
  const yearFrom = Math.min(...people.map(p => p.born))
  const yearTo = Math.max(...people.map(p => p.died))
  if (!Number.isFinite(yearFrom) || !Number.isFinite(yearTo)) return null
  return { yearFrom, yearTo: Math.max(yearFrom, yearTo) }
}

export function clampYearToRange(year: number, yearFrom: number, yearTo: number): number {
  if (yearFrom > yearTo) return yearFrom
  return Math.min(Math.max(year, yearFrom), yearTo)
}

/** Opacity for a content year `y` under temporal rules. 0 = hidden. */
export function temporalOpacity(y: number | null | undefined, state: TemporalState): number {
  if (y == null || !Number.isFinite(y)) return 0
  const { year, yearFrom, yearTo, mode } = state
  if (y < yearFrom - ECHO_YEARS || y > yearTo) return 0

  let rangeOpacity = 1
  if (y < yearFrom) rangeOpacity = ECHO_OPACITY

  if (mode === 'range') return rangeOpacity

  if (y > year) return 0
  const age = year - y
  if (age >= FADE_END_YEARS) return 0
  let playOpacity = 1
  if (age > FADE_START_YEARS) {
    playOpacity = 1 - (age - FADE_START_YEARS) / (FADE_END_YEARS - FADE_START_YEARS)
  }
  return Math.min(rangeOpacity, playOpacity)
}

export function buildAvatarTracks(
  people: Person[],
  locations: Location[],
  personalEvents: PersonHistoryEvent[],
): PersonAvatarTrack[] {
  const locationsById = new Map(locations.map(l => [l.id, l]))
  const eventsByPerson = new Map<string, PersonHistoryEvent[]>()
  for (const e of personalEvents) {
    const list = eventsByPerson.get(e.personId) ?? []
    list.push(e)
    eventsByPerson.set(e.personId, list)
  }

  return people
    .map(person => {
      const accent = ColorsService.getAccentColor(person.nationality)
      const waypoints: AvatarWaypoint[] = []

      const born = locCoords(locationsById, person.bornLocation)
      if (born) {
        waypoints.push({
          lat: born.lat,
          lng: born.lng,
          year: person.born,
          kind: 'birth',
          label: `Narodziny — ${born.name}`,
        })
      }

      const events = [...(eventsByPerson.get(person.id) ?? [])].sort(
        (a, b) => (a.yearFrom ?? 0) - (b.yearFrom ?? 0),
      )
      for (const e of events) {
        if (e.yearFrom == null) continue
        const c = locCoords(locationsById, e.locationId)
        if (!c) continue
        waypoints.push({
          lat: c.lat,
          lng: c.lng,
          year: e.yearFrom,
          kind: 'personal',
          label: e.name,
        })
      }

      if (!person.stillAlive) {
        const died = locCoords(locationsById, person.diedLocation)
        if (died && person.died != null) {
          waypoints.push({
            lat: died.lat,
            lng: died.lng,
            year: person.died,
            kind: 'death',
            label: `Śmierć — ${died.name}`,
          })
        }
      }

      waypoints.sort((a, b) => a.year - b.year || a.kind.localeCompare(b.kind))

      const deduped: AvatarWaypoint[] = []
      for (const wp of waypoints) {
        const prev = deduped[deduped.length - 1]
        if (prev && prev.lat === wp.lat && prev.lng === wp.lng && prev.year === wp.year) continue
        deduped.push(wp)
      }

      return {
        personId: person.id,
        name: person.name,
        accent,
        thumbnail: person.thumbnail,
        born: person.born,
        died: person.died,
        stillAlive: person.stillAlive,
        waypoints: deduped,
      }
    })
    .filter(t => t.waypoints.length > 0)
}

/** Wall-clock hop rate so footsteps stay steady even when playback is 0.25× or 8×. */
export const WALK_HOPS_PER_SECOND = 2.4

/**
 * Walk-like position along the avatar track: year drives progress along the path;
 * bounce/sway phase comes from wall-clock time so hop speed is independent of playback tempo.
 */
export function positionAtYear(
  track: PersonAvatarTrack,
  year: number,
  hopClockMs: number = typeof performance !== 'undefined' ? performance.now() : 0,
): { lat: number; lng: number } | null {
  const wps = track.waypoints
  if (wps.length === 0) return null
  if (year <= wps[0].year) return { lat: wps[0].lat, lng: wps[0].lng }
  const last = wps[wps.length - 1]
  if (year >= last.year) return { lat: last.lat, lng: last.lng }

  for (let i = 0; i < wps.length - 1; i++) {
    const a = wps[i]
    const b = wps[i + 1]
    if (year < a.year || year > b.year) continue
    if (b.year === a.year) return { lat: b.lat, lng: b.lng }
    const t = (year - a.year) / (b.year - a.year)
    const dLat = b.lat - a.lat
    const dLng = b.lng - a.lng
    const len = Math.hypot(dLat, dLng) || 1
    const baseLat = a.lat + dLat * t
    const baseLng = a.lng + dLng * t
    // Phase from wall clock; personId salts so neighbors don't hop in sync.
    let salt = 0
    for (let c = 0; c < track.personId.length; c++) salt = (salt * 31 + track.personId.charCodeAt(c)) | 0
    const phase = (hopClockMs / 1000) * WALK_HOPS_PER_SECOND * Math.PI + (salt % 1000) * 0.01
    const bounce = Math.abs(Math.sin(phase))
    const sway = Math.sin(phase * 2)
    const hopAmp = Math.min(0.16, Math.max(0.05, len * 0.12))
    const swayAmp = Math.min(0.07, Math.max(0.02, len * 0.045))
    const pLat = -dLng / len
    const pLng = dLat / len
    return {
      lat: baseLat + bounce * hopAmp + sway * pLat * swayAmp,
      lng: baseLng + sway * pLng * swayAmp,
    }
  }
  return { lat: last.lat, lng: last.lng }
}

/** Portrait visibility year: alive → playhead; after death → death year (for fade-by-age). */
export function portraitContentYear(track: PersonAvatarTrack, playheadYear: number): number {
  if (track.stillAlive) return Math.min(playheadYear, track.died)
  if (playheadYear <= track.died) return playheadYear
  return track.died
}

export function avatarPositionAt(track: PersonAvatarTrack, state: TemporalState): AvatarPosition | null {
  const lifeEnd = track.stillAlive ? Number.POSITIVE_INFINITY : track.died
  if (lifeEnd < state.yearFrom - ECHO_YEARS || track.born > state.yearTo) return null

  if (state.mode === 'range') {
    const parkYear = Math.min(state.yearTo, track.stillAlive ? state.yearTo : track.died)
    const pos = positionAtYear(track, clampYearToRange(parkYear, track.born, track.stillAlive ? parkYear : track.died))
    if (!pos) return null
    const overlapsRange = lifeEnd >= state.yearFrom && track.born <= state.yearTo
    return { ...pos, opacity: overlapsRange ? 1 : ECHO_OPACITY }
  }

  if (state.year < track.born) return null
  const contentY = portraitContentYear(track, state.year)
  const opacity = temporalOpacity(contentY, state)
  if (opacity <= 0) return null
  const travelEnd = track.stillAlive ? state.year : Math.min(state.year, track.died)
  const pos = positionAtYear(track, clampYearToRange(travelEnd, track.born, track.stillAlive ? travelEnd : track.died))
  if (!pos) return null
  return { ...pos, opacity }
}

export function contentYearsFromPaths(
  paths: PersonLifePath[],
  tracks: PersonAvatarTrack[],
  opts: {
    showAuthors: boolean
    showPublications: boolean
    showPersonal: boolean
  },
): number[] {
  const years = new Set<number>()
  if (!opts.showAuthors) return []

  for (const path of paths) {
    for (const p of path.points) {
      if (p.year == null || !Number.isFinite(p.year)) continue
      if (p.kind === 'publication' && !opts.showPublications) continue
      if (p.kind === 'personal' && !opts.showPersonal) continue
      years.add(Math.round(p.year))
    }
  }
  for (const track of tracks) {
    for (const wp of track.waypoints) years.add(Math.round(wp.year))
    years.add(Math.round(track.born))
    if (!track.stillAlive) years.add(Math.round(track.died))
  }

  return [...years].sort((a, b) => a - b)
}

/**
 * Years/second for advancing from `fromYear` toward `toYear` over the next step,
 * compressing empty spans so a whole empty run lasts at most EMPTY_SPAN_MAX_SECONDS.
 */
export function playbackYearsPerSecond(
  fromYear: number,
  toYear: number,
  contentYears: number[],
  speedMultiplier: number = 1,
): number {
  const mult = Number.isFinite(speedMultiplier) && speedMultiplier > 0 ? speedMultiplier : 1
  const dense = DENSE_YEARS_PER_SECOND * mult
  if (toYear <= fromYear) return dense
  const nextContent = contentYears.find(y => y > fromYear)
  const emptyUntil = nextContent == null ? toYear : Math.min(nextContent, toYear)
  const emptySpan = emptyUntil - fromYear
  // Near content (within 1 year) or overlapping a content year → dense pace.
  const nearby = contentYears.some(y => Math.abs(y - fromYear) <= 1)
  if (nearby || emptySpan <= 1) return dense
  // Entire remaining empty run should finish in <= EMPTY_SPAN_MAX_SECONDS / mult.
  const emptyBudget = EMPTY_SPAN_MAX_SECONDS / mult
  return Math.max(dense, emptySpan / Math.max(emptyBudget, 0.05))
}

export function segmentOpacity(a: LifePoint, b: LifePoint, state: TemporalState): number {
  const ya = a.year
  const yb = b.year
  if (ya == null && yb == null) return 0
  if (ya == null) return temporalOpacity(yb, state)
  if (yb == null) return temporalOpacity(ya, state)
  return Math.min(temporalOpacity(ya, state), temporalOpacity(yb, state))
}
