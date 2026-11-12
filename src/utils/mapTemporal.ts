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

export type PositionAtYearOpts = {
  /** When false, skip geographic hop/sway (crowded portraits). Default true. */
  hop?: boolean
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
  opts: PositionAtYearOpts = {},
): { lat: number; lng: number } | null {
  const allowHop = opts.hop !== false
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
    if (!allowHop) return { lat: baseLat, lng: baseLng }
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

export function avatarPositionAt(
  track: PersonAvatarTrack,
  state: TemporalState,
  opts: PositionAtYearOpts = {},
): AvatarPosition | null {
  const lifeEnd = track.stillAlive ? Number.POSITIVE_INFINITY : track.died
  if (lifeEnd < state.yearFrom - ECHO_YEARS || track.born > state.yearTo) return null

  if (state.mode === 'range') {
    const parkYear = Math.min(state.yearTo, track.stillAlive ? state.yearTo : track.died)
    const pos = positionAtYear(
      track,
      clampYearToRange(parkYear, track.born, track.stillAlive ? parkYear : track.died),
      undefined,
      opts,
    )
    if (!pos) return null
    const overlapsRange = lifeEnd >= state.yearFrom && track.born <= state.yearTo
    return { ...pos, opacity: overlapsRange ? 1 : ECHO_OPACITY }
  }

  if (state.year < track.born) return null
  const contentY = portraitContentYear(track, state.year)
  const opacity = temporalOpacity(contentY, state)
  if (opacity <= 0) return null
  const travelEnd = track.stillAlive ? state.year : Math.min(state.year, track.died)
  const pos = positionAtYear(
    track,
    clampYearToRange(travelEnd, track.born, track.stillAlive ? travelEnd : track.died),
    undefined,
    opts,
  )
  if (!pos) return null
  return { ...pos, opacity }
}

/** Screen-space crowd: ≥ this many other portraits within radius → no hop, pulse border. */
export const PORTRAIT_CROWD_NEIGHBORS = 3
export const PORTRAIT_CROWD_RADIUS_FACTOR = 1.25

export function crowdedPortraitIds(
  portraits: { id: string; x: number; y: number; diameterPx: number }[],
  neighborMin = PORTRAIT_CROWD_NEIGHBORS,
  radiusFactor = PORTRAIT_CROWD_RADIUS_FACTOR,
): Set<string> {
  const crowded = new Set<string>()
  for (let i = 0; i < portraits.length; i++) {
    const a = portraits[i]
    let n = 0
    const r = (a.diameterPx / 2) * radiusFactor * 2
    for (let j = 0; j < portraits.length; j++) {
      if (i === j) continue
      const b = portraits[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      if (dx * dx + dy * dy <= r * r) n += 1
    }
    if (n >= neighborMin) crowded.add(a.id)
  }
  return crowded
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

/** Sliding window (years) for local content density. Provisional — tune after playtest. */
export const DENSITY_WINDOW_YEARS = 10
/** Baseline years/s at 1× when the density window is empty/sparse. */
export const SPARSE_YEARS_PER_SECOND = DENSE_YEARS_PER_SECOND
/** Years/s at 1× when every year in the window has content (~3× slower). Provisional. */
export const FULL_DENSE_YEARS_PER_SECOND = 5

function smoothstep01(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

/** Fraction of years in a 10-year window around `fromYear` that have any content. */
export function contentDensityInWindow(
  fromYear: number,
  contentYears: number[],
  windowYears: number = DENSITY_WINDOW_YEARS,
): number {
  if (windowYears <= 0) return 0
  const y0 = Math.floor(fromYear) - Math.floor((windowYears - 1) / 2)
  const y1 = y0 + windowYears - 1
  let hits = 0
  for (const y of contentYears) {
    if (y >= y0 && y <= y1) hits += 1
  }
  return Math.min(1, hits / windowYears)
}

/**
 * Years/second for advancing from `fromYear` toward `toYear` over the next step.
 * Sparse decades ≈ SPARSE_YEARS_PER_SECOND; fully dense ≈ FULL_DENSE_YEARS_PER_SECOND;
 * empty spans still compress to ≤ EMPTY_SPAN_MAX_SECONDS.
 */
export function playbackYearsPerSecond(
  fromYear: number,
  toYear: number,
  contentYears: number[],
  speedMultiplier: number = 1,
): number {
  const mult = Number.isFinite(speedMultiplier) && speedMultiplier > 0 ? speedMultiplier : 1
  if (toYear <= fromYear) return SPARSE_YEARS_PER_SECOND * mult

  const nextContent = contentYears.find(y => y > fromYear)
  const emptyUntil = nextContent == null ? toYear : Math.min(nextContent, toYear)
  const emptySpan = emptyUntil - fromYear
  const density = contentDensityInWindow(fromYear, contentYears)
  // Empty window ahead → compress the gap.
  if (density <= 0 && emptySpan > 1) {
    const emptyBudget = EMPTY_SPAN_MAX_SECONDS / mult
    return Math.max(SPARSE_YEARS_PER_SECOND * mult, emptySpan / Math.max(emptyBudget, 0.05))
  }
  const t = smoothstep01(density)
  const base =
    SPARSE_YEARS_PER_SECOND * (1 - t) + FULL_DENSE_YEARS_PER_SECOND * t
  return base * mult
}

export function segmentOpacity(a: LifePoint, b: LifePoint, state: TemporalState): number {
  const ya = a.year
  const yb = b.year
  if (ya == null && yb == null) return 0
  if (ya == null) return temporalOpacity(yb, state)
  if (yb == null) return temporalOpacity(ya, state)
  return Math.min(temporalOpacity(ya, state), temporalOpacity(yb, state))
}
