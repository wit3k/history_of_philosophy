import type Location from '../data/dto/Location'
import type Person from '../data/dto/Person'
import type PersonHistoryEvent from '../data/dto/PersonHistoryEvent'
import type Publication from '../data/dto/Publication'
import ColorsService from '../services/Colors'

export type LifePointKind = 'birth' | 'personal' | 'publication' | 'death'

export type LifePoint = {
  kind: LifePointKind
  lat: number
  lng: number
  year: number | null
  label: string
  personId: string
  accent: string
  refId?: string
}

export type PersonLifePath = {
  personId: string
  name: string
  accent: string
  points: LifePoint[]
}

function locCoords(locationsById: Map<string, Location>, id: string | number | null | undefined) {
  if (id == null || id === '') return null
  const loc = locationsById.get(String(id))
  if (!loc) return null
  const { x: lat, y: lng } = loc.coordinates
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng, name: loc.name }
}

export function buildPersonLifePaths(
  people: Person[],
  locations: Location[],
  personalEvents: PersonHistoryEvent[],
  publications: Publication[],
): PersonLifePath[] {
  const locationsById = new Map(locations.map(l => [l.id, l]))
  const eventsByPerson = new Map<string, PersonHistoryEvent[]>()
  for (const e of personalEvents) {
    const list = eventsByPerson.get(e.personId) ?? []
    list.push(e)
    eventsByPerson.set(e.personId, list)
  }
  const pubsByPerson = new Map<string, Publication[]>()
  for (const p of publications) {
    const list = pubsByPerson.get(p.authorId) ?? []
    list.push(p)
    pubsByPerson.set(p.authorId, list)
  }

  return people
    .map(person => {
      const accent = ColorsService.getAccentColor(person.nationality)
      const points: LifePoint[] = []

      const born = locCoords(locationsById, person.bornLocation)
      if (born) {
        points.push({
          kind: 'birth',
          lat: born.lat,
          lng: born.lng,
          year: person.born,
          label: `Narodziny — ${born.name}`,
          personId: person.id,
          accent,
        })
      }

      const events = [...(eventsByPerson.get(person.id) ?? [])].sort(
        (a, b) => (a.yearFrom ?? 0) - (b.yearFrom ?? 0),
      )
      for (const e of events) {
        const c = locCoords(locationsById, e.locationId)
        if (!c) continue
        points.push({
          kind: 'personal',
          lat: c.lat,
          lng: c.lng,
          year: e.yearFrom,
          label: e.name,
          personId: person.id,
          accent,
          refId: e.id,
        })
      }

      const pubs = [...(pubsByPerson.get(person.id) ?? [])].sort(
        (a, b) => a.publicationDate - b.publicationDate,
      )
      for (const p of pubs) {
        const c = locCoords(locationsById, p.publicationLocation)
        if (!c) continue
        points.push({
          kind: 'publication',
          lat: c.lat,
          lng: c.lng,
          year: p.publicationDate,
          label: p.title,
          personId: person.id,
          accent,
          refId: p.id,
        })
      }

      if (!person.stillAlive) {
        const died = locCoords(locationsById, person.diedLocation)
        if (died) {
          points.push({
            kind: 'death',
            lat: died.lat,
            lng: died.lng,
            year: person.died,
            label: `Śmierć — ${died.name}`,
            personId: person.id,
            accent,
          })
        }
      }

      return { personId: person.id, name: person.name, accent, points }
    })
    .filter(path => path.points.length > 0)
}

type GeoJsonFeature = {
  type: 'Feature'
  properties: Record<string, string | number | null>
  geometry:
    | { type: 'Point'; coordinates: [number, number] }
    | { type: 'LineString'; coordinates: [number, number][] }
}

export type LifePathGeoJson = {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}

export function lifePathsToGeoJson(
  paths: PersonLifePath[],
  opts: {
    showAuthors: boolean
    showLifelines: boolean
    showPublications: boolean
    showPersonal: boolean
  },
): LifePathGeoJson {
  const features: GeoJsonFeature[] = []
  if (!opts.showAuthors) return { type: 'FeatureCollection', features }

  for (const path of paths) {
    const visiblePoints = path.points.filter(p => {
      if (p.kind === 'publication') return opts.showPublications
      if (p.kind === 'personal') return opts.showPersonal
      return true
    })
    if (visiblePoints.length === 0) continue

    if (opts.showLifelines && visiblePoints.length >= 2) {
      features.push({
        type: 'Feature',
        properties: {
          kind: 'path',
          personId: path.personId,
          name: path.name,
          accent: path.accent,
        },
        geometry: {
          type: 'LineString',
          coordinates: visiblePoints.map(p => [p.lng, p.lat]),
        },
      })
    }

    for (const p of visiblePoints) {
      features.push({
        type: 'Feature',
        properties: {
          kind: p.kind,
          personId: p.personId,
          personName: path.name,
          label: p.label,
          year: p.year,
          accent: p.accent,
          refId: p.refId ?? null,
        },
        geometry: {
          type: 'Point',
          coordinates: [p.lng, p.lat],
        },
      })
    }
  }

  return { type: 'FeatureCollection', features }
}

export function boundsFromPaths(paths: PersonLifePath[]): [[number, number], [number, number]] | null {
  let minLat = Infinity
  let maxLat = -Infinity
  let minLng = Infinity
  let maxLng = -Infinity
  let any = false
  for (const path of paths) {
    for (const p of path.points) {
      any = true
      minLat = Math.min(minLat, p.lat)
      maxLat = Math.max(maxLat, p.lat)
      minLng = Math.min(minLng, p.lng)
      maxLng = Math.max(maxLng, p.lng)
    }
  }
  if (!any) return null
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ]
}
