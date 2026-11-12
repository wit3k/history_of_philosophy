import { setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import React from 'react'
import MapGl, { type MapRef } from 'react-map-gl/maplibre'
import type Location from '../../data/dto/Location'
import type Person from '../../data/dto/Person'
import type PersonHistoryEvent from '../../data/dto/PersonHistoryEvent'
import type Publication from '../../data/dto/Publication'
import { getAppBasePath } from '../../utils/appUrl'
import {
  boundsFromPaths,
  buildPersonLifePaths,
  lifePathsToGeoJson,
  personLifeLineCoordinates,
} from '../../utils/lifePaths'
import {
  avatarPositionAt,
  buildAvatarTracks,
  crowdedPortraitIds,
  type TemporalState,
} from '../../utils/mapTemporal'
import { layoutScreenBubbles, mapAccentForBasemap } from '../../utils/mapVisual'
import { formatYear } from '../../utils/years'
import {
  MapPixiOverlay,
  type OverlayBubble,
  type OverlayPathSeg,
} from './MapPixiOverlay'

const CLUSTER_HUB_DIAMETER = 34
const POPUP_Z_INDEX = 1000
const HOVER_TOOLTIP_MEDIA = '(hover: hover) and (pointer: fine)'
/** Match TimelineLayers search dim (alpha ≈ 0.22). */
const SEARCH_DIM = 0.22
function searchNeedle(query: string): string {
  return query.trim().toLowerCase()
}

function matchesSearch(haystack: string, needle: string): boolean {
  if (!needle) return true
  return haystack.toLowerCase().includes(needle)
}

/** temporal base × search dim only (selection uses stroke/label emphasis, not dimming). */
function composedOpacity(
  base: number,
  opts: {
    searchActive: boolean
    searchMatch: boolean
  },
): number {
  if (opts.searchActive && !opts.searchMatch) return base * SEARCH_DIM
  return base
}

const maplibreWorkerUrl = `${getAppBasePath()}/maplibre-gl-worker.mjs`
setWorkerUrl(maplibreWorkerUrl)

const LIGHT_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark'
const APP_BASE = getAppBasePath()

function canHoverTooltips(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(HOVER_TOOLTIP_MEDIA).matches
}

const EUROPE_FALLBACK = {
  latitude: 50,
  longitude: 10,
  zoom: 3.2,
}

const KIND_LABELS: Record<string, string> = {
  birth: 'Narodziny',
  death: 'Śmierć',
  publication: 'Publikacja',
  personal: 'Wydarzenie osobiste',
  portrait: 'Osoba',
}

export type MapCamera = {
  latitude: number
  longitude: number
  zoom: number
}

type MapBubbleItem = {
  id: string
  kind: string
  personId: string
  refId: string | null
  lat: number
  lng: number
  accent: string
  opacity: number
  personName: string
  label: string
  year: number | null
  radius: number
  thumbnail: string | null
}

const PORTRAIT_DIAMETER = 28

type PointTooltip = {
  id: string
  longitude: number
  latitude: number
  kind: string
  personName: string
  label: string
  year: number | null
}

type GeographicMapProps = {
  darkMode: boolean
  displayAuthors: boolean
  displayAuthorsTimeline: boolean
  displayPublications: boolean
  displayPersonHistoryEvents: boolean
  peopleList: Person[]
  locationsList: Location[]
  peopleHistoryEvents: PersonHistoryEvent[]
  publicationsList: Publication[]
  searchQuery: string
  temporal: TemporalState
  /** When false, freeze hop/pulse so portraits stay still on pause / scrub. */
  playing?: boolean
  /** Camera for first paint / fit. Not a controlled follow-target (avoids pan↔URL loops). */
  initialCamera: MapCamera | null
  /**
   * Bump to force jumpTo(initialCamera). Use for location focus / back-forward URL only —
   * not after ordinary pan commits.
   */
  cameraFocusToken?: number
  onCameraCommit: (camera: MapCamera) => void
  onPersonClick: (personId: string) => void
  onPublicationClick: (publicationId: string, personId: string) => void
  windowWidth: number
  windowHeight: number
}

function kindRadius(kind: string): number {
  if (kind === 'birth' || kind === 'death') return 14
  if (kind === 'personal') return 12
  if (kind === 'publication') return 11
  return 12
}

const GeographicMap = (props: GeographicMapProps) => {
  const mapRef = React.useRef<MapRef>(null)
  const overlayHostRef = React.useRef<HTMLDivElement>(null)
  const overlayRef = React.useRef<MapPixiOverlay | null>(null)
  const fittedForKey = React.useRef<string | null>(null)
  const skipNextMoveEnd = React.useRef(false)
  const [tooltip, setTooltip] = React.useState<PointTooltip | null>(null)
  const [expandedClusters, setExpandedClusters] = React.useState<Set<string>>(() => new Set())
  const [layoutTick, setLayoutTick] = React.useState(0)
  const [hoverTooltips, setHoverTooltips] = React.useState(canHoverTooltips)
  const [selectedPersonId, setSelectedPersonId] = React.useState<string | null>(null)
  const [markerHoverPersonId, setMarkerHoverPersonId] = React.useState<string | null>(null)
  const [pathHoverPersonId, setPathHoverPersonId] = React.useState<string | null>(null)
  const layoutRafRef = React.useRef(0)
  const clearMarkerHoverTimer = React.useRef<number | null>(null)

  // Playhead is day-quantized during playback for smooth portrait travel; keep fractions as-is.
  const mapTemporal = React.useMemo(
    () => ({
      year: props.temporal.year,
      yearFrom: props.temporal.yearFrom,
      yearTo: props.temporal.yearTo,
      mode: props.temporal.mode,
    }),
    [props.temporal.year, props.temporal.mode, props.temporal.yearFrom, props.temporal.yearTo],
  )

  // Sticky click selection wins; hover only previews when nothing is selected.
  const activePersonId = selectedPersonId ?? markerHoverPersonId ?? pathHoverPersonId
  const needle = searchNeedle(props.searchQuery)
  const searchActive = needle.length > 0

  const personNameById = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const p of props.peopleList) map.set(String(p.id), p.name)
    return map
  }, [props.peopleList])

  const publicationTitleById = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const p of props.publicationsList) map.set(String(p.id), p.title)
    return map
  }, [props.publicationsList])

  const personNameMatches = React.useCallback(
    (personId: string) => matchesSearch(personNameById.get(String(personId)) ?? '', needle),
    [needle, personNameById],
  )

  const bubbleSearchMatch = React.useCallback(
    (item: MapBubbleItem) => {
      if (!searchActive) return true
      if (item.kind === 'publication') {
        const title =
          (item.refId != null ? publicationTitleById.get(String(item.refId)) : null) ?? item.label
        return matchesSearch(title, needle)
      }
      return personNameMatches(item.personId)
    },
    [needle, personNameMatches, publicationTitleById, searchActive],
  )

  React.useEffect(() => {
    const media = window.matchMedia(HOVER_TOOLTIP_MEDIA)
    const sync = () => setHoverTooltips(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const setMarkerHover = React.useCallback((personId: string | null) => {
    if (clearMarkerHoverTimer.current != null) {
      window.clearTimeout(clearMarkerHoverTimer.current)
      clearMarkerHoverTimer.current = null
    }
    if (personId) {
      setMarkerHoverPersonId(personId)
      return
    }
    clearMarkerHoverTimer.current = window.setTimeout(() => {
      setMarkerHoverPersonId(null)
      clearMarkerHoverTimer.current = null
    }, 50)
  }, [])

  const paths = React.useMemo(
    () =>
      buildPersonLifePaths(
        props.peopleList,
        props.locationsList,
        props.peopleHistoryEvents,
        props.publicationsList,
      ),
    [props.peopleList, props.locationsList, props.peopleHistoryEvents, props.publicationsList],
  )

  const avatarTracks = React.useMemo(
    () => buildAvatarTracks(props.peopleList, props.locationsList, props.peopleHistoryEvents),
    [props.peopleList, props.locationsList, props.peopleHistoryEvents],
  )

  const geojson = React.useMemo(
    () =>
      lifePathsToGeoJson(paths, {
        showAuthors: props.displayAuthors,
        showLifelines: props.displayAuthorsTimeline,
        showPublications: props.displayPublications,
        showPersonal: props.displayPersonHistoryEvents,
        temporal: mapTemporal,
        darkMode: props.darkMode,
      }),
    [
      paths,
      props.displayAuthors,
      props.displayAuthorsTimeline,
      props.displayPublications,
      props.displayPersonHistoryEvents,
      mapTemporal,
      props.darkMode,
    ],
  )

  const overlayPathSegs: OverlayPathSeg[] = React.useMemo(() => {
    const out: OverlayPathSeg[] = []
    for (const f of geojson.features) {
      if (f.properties.kind !== 'path' || f.geometry.type !== 'LineString') continue
      const personId = String(f.properties.personId ?? '')
      const base = Number(f.properties.opacity ?? 0.85)
      const opacity = composedOpacity(base, {
        searchActive,
        searchMatch: personNameMatches(personId),
      })
      if (opacity <= 0.05) continue
      out.push({
        id: `path:${personId}:${f.properties.segment}`,
        personId,
        accent: String(f.properties.accent ?? '#888'),
        opacity,
        coordinates: f.geometry.coordinates,
      })
    }
    return out
  }, [geojson, personNameMatches, searchActive])

  const highlightCoords = React.useMemo(() => {
    if (!activePersonId) return null
    const path = paths.find(p => p.personId === activePersonId)
    if (!path) return null
    const coordinates = personLifeLineCoordinates(path, {
      showPublications: props.displayPublications,
      showPersonal: props.displayPersonHistoryEvents,
      temporal: mapTemporal,
    })
    if (coordinates.length < 2) return null
    return {
      coordinates,
      accent: mapAccentForBasemap(path.accent, props.darkMode),
    }
  }, [
    activePersonId,
    paths,
    props.displayPublications,
    props.displayPersonHistoryEvents,
    props.darkMode,
    mapTemporal,
  ])

  const mapBubbles = React.useMemo(() => {
    const items: MapBubbleItem[] = []
    for (const f of geojson.features) {
      if (f.properties.kind === 'path' || f.geometry.type !== 'Point') continue
      const opacity = Number(f.properties.opacity ?? 0.95)
      if (opacity < 0.02) continue
      const [lng, lat] = f.geometry.coordinates
      const yearRaw = f.properties.year
      const year =
        yearRaw == null || yearRaw === ''
          ? null
          : Number.isFinite(Number(yearRaw))
            ? Number(yearRaw)
            : null
      const refRaw = f.properties.refId
      items.push({
        id: `${f.properties.kind}:${f.properties.personId}:${f.properties.refId ?? f.properties.label}:${year}`,
        kind: String(f.properties.kind ?? ''),
        personId: String(f.properties.personId ?? ''),
        refId: refRaw == null || refRaw === '' ? null : String(refRaw),
        lat,
        lng,
        accent: String(f.properties.accent ?? '#888'),
        opacity,
        personName: String(f.properties.personName ?? ''),
        label: String(f.properties.label ?? ''),
        year,
        radius: kindRadius(String(f.properties.kind ?? '')),
        thumbnail: null,
      })
    }
    if (props.displayAuthors) {
      for (const track of avatarTracks) {
        // Stable geographic position for layout; hop/pulse applied later per crowd.
        const pos = avatarPositionAt(track, mapTemporal, { hop: false })
        if (!pos || pos.opacity < 0.02) continue
        items.push({
          id: `portrait:${track.personId}`,
          kind: 'portrait',
          personId: track.personId,
          refId: null,
          lat: pos.lat,
          lng: pos.lng,
          accent: mapAccentForBasemap(track.accent, props.darkMode),
          opacity: pos.opacity,
          personName: track.name,
          label: track.name,
          year: null,
          radius: PORTRAIT_DIAMETER,
          thumbnail: track.thumbnail,
        })
      }
    }
    return items
  }, [
    geojson,
    avatarTracks,
    props.displayAuthors,
    mapTemporal,
    props.darkMode,
  ])

  const bubbleById = React.useMemo(() => {
    const map = new Map<string, MapBubbleItem>()
    for (const item of mapBubbles) map.set(item.id, item)
    return map
  }, [mapBubbles])

  type PlacedMarker =
    | { kind: 'individual'; item: MapBubbleItem; lat: number; lng: number }
    | {
        kind: 'hub'
        key: string
        members: MapBubbleItem[]
        lat: number
        lng: number
      }

  /** Softens portrait ring reflows when pile membership changes mid-playback. */
  const portraitLayoutMemRef = React.useRef(
    new Map<string, { geoX: number; geoY: number; x: number; y: number }>(),
  )
  const portraitLayoutMemTickRef = React.useRef(layoutTick)
  if (portraitLayoutMemTickRef.current !== layoutTick) {
    portraitLayoutMemTickRef.current = layoutTick
    portraitLayoutMemRef.current.clear()
  }

  const { placedMarkers, displayPosById, hubsByKey } = React.useMemo(() => {
    void layoutTick
    const map = mapRef.current?.getMap()
    const placed: PlacedMarker[] = []
    const displayPos = new Map<string, { lat: number; lng: number }>()
    const hubs = new Map<string, MapBubbleItem[]>()
    const mem = portraitLayoutMemRef.current
    const seenPortraits = new Set<string>()

    if (!map) {
      for (const item of mapBubbles) {
        placed.push({ kind: 'individual', item, lat: item.lat, lng: item.lng })
        displayPos.set(item.id, { lat: item.lat, lng: item.lng })
      }
      return { placedMarkers: placed, displayPosById: displayPos, hubsByKey: hubs }
    }

    const geoById = new Map<string, { x: number; y: number }>()
    const points = mapBubbles.map(item => {
      const p = map.project([item.lng, item.lat])
      geoById.set(item.id, { x: p.x, y: p.y })
      return {
        id: item.id,
        x: p.x,
        y: p.y,
        diameterPx: item.radius,
        // People are never count-hubbed — only push-separated when overlapping.
        groupable: item.kind !== 'portrait',
      }
    })
    const nodes = layoutScreenBubbles(points, {
      hubDiameterPx: CLUSTER_HUB_DIAMETER,
      forceExpandKeys: expandedClusters,
    })

    for (const node of nodes) {
      if (node.kind === 'individual') {
        const item = bubbleById.get(node.id)
        if (!item) continue
        let x = node.x
        let y = node.y
        if (item.kind === 'portrait') {
          seenPortraits.add(item.id)
          const geo = geoById.get(item.id) ?? { x: node.x, y: node.y }
          const prev = mem.get(item.id)
          if (prev) {
            const geoJump = Math.hypot(geo.x - prev.geoX, geo.y - prev.geoY)
            if (geoJump < 48) {
              // Follow geographic drift, keep prior pack offset, ease toward new ring slot.
              const carriedX = prev.x + (geo.x - prev.geoX)
              const carriedY = prev.y + (geo.y - prev.geoY)
              x = carriedX * 0.82 + node.x * 0.18
              y = carriedY * 0.82 + node.y * 0.18
            }
          }
          mem.set(item.id, { geoX: geo.x, geoY: geo.y, x, y })
        }
        const ll = map.unproject([x, y])
        placed.push({ kind: 'individual', item, lat: ll.lat, lng: ll.lng })
        displayPos.set(item.id, { lat: ll.lat, lng: ll.lng })
      } else {
        const ll = map.unproject([node.x, node.y])
        const members = node.memberIds
          .map(id => bubbleById.get(id))
          .filter((m): m is MapBubbleItem => m != null && m.kind !== 'portrait')
        if (members.length === 0) continue
        if (members.length === 1) {
          const item = members[0]
          placed.push({ kind: 'individual', item, lat: ll.lat, lng: ll.lng })
          displayPos.set(item.id, { lat: ll.lat, lng: ll.lng })
          continue
        }
        hubs.set(node.key, members)
        placed.push({
          kind: 'hub',
          key: node.key,
          members,
          lat: ll.lat,
          lng: ll.lng,
        })
        for (const m of members) {
          displayPos.set(m.id, { lat: ll.lat, lng: ll.lng })
        }
      }
    }

    for (const id of [...mem.keys()]) {
      if (!seenPortraits.has(id)) mem.delete(id)
    }

    return { placedMarkers: placed, displayPosById: displayPos, hubsByKey: hubs }
  }, [bubbleById, expandedClusters, layoutTick, mapBubbles])

  // Only collapse manual expands when the selected range/mode changes — not every playhead tick.
  React.useEffect(() => {
    setExpandedClusters(new Set())
    setTooltip(null)
    setSelectedPersonId(null)
  }, [mapTemporal.yearFrom, mapTemporal.yearTo, mapTemporal.mode])

  React.useEffect(() => {
    return () => {
      if (layoutRafRef.current) cancelAnimationFrame(layoutRafRef.current)
    }
  }, [])

  const fitKey = React.useMemo(
    () =>
      `${props.peopleList.map(p => p.id).join(',')}|${props.displayAuthors}|${props.displayPublications}|${props.displayPersonHistoryEvents}`,
    [props.peopleList, props.displayAuthors, props.displayPublications, props.displayPersonHistoryEvents],
  )

  const applyFitOrInitial = React.useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    if (props.initialCamera) {
      // Programmatic: do not echo commit back into React/URL (that caused pan↔jump loops).
      skipNextMoveEnd.current = true
      map.jumpTo({
        center: [props.initialCamera.longitude, props.initialCamera.latitude],
        zoom: props.initialCamera.zoom,
      })
      fittedForKey.current = fitKey
      return
    }

    if (fittedForKey.current === fitKey) return
    fittedForKey.current = fitKey

    const bounds = boundsFromPaths(
      paths.map(path => ({
        ...path,
        points: path.points.filter(p => {
          if (p.kind === 'publication') return props.displayPublications
          if (p.kind === 'personal') return props.displayPersonHistoryEvents
          return props.displayAuthors
        }),
      })),
    )

    // Collection fit: allow moveend to commit the resulting camera into the URL.
    skipNextMoveEnd.current = false
    if (!bounds || !props.displayAuthors) {
      map.jumpTo({
        center: [EUROPE_FALLBACK.longitude, EUROPE_FALLBACK.latitude],
        zoom: EUROPE_FALLBACK.zoom,
      })
      return
    }

    map.fitBounds(bounds, { padding: 64, maxZoom: 8, duration: 0 })
  }, [
    fitKey,
    paths,
    props.displayAuthors,
    props.displayPersonHistoryEvents,
    props.displayPublications,
    props.initialCamera,
  ])

  const bumpLayout = React.useCallback(() => {
    if (layoutRafRef.current) return
    layoutRafRef.current = requestAnimationFrame(() => {
      layoutRafRef.current = 0
      setLayoutTick(t => t + 1)
    })
  }, [])

  React.useEffect(() => {
    if (props.initialCamera) {
      fittedForKey.current = fitKey
      return
    }
    fittedForKey.current = null
    applyFitOrInitial()
  }, [applyFitOrInitial, fitKey, props.initialCamera])

  // External focus only (location button / history navigation) — never follow pan commits.
  const initialCameraRef = React.useRef(props.initialCamera)
  initialCameraRef.current = props.initialCamera
  const cameraFocusToken = props.cameraFocusToken
  React.useEffect(() => {
    if (cameraFocusToken == null || cameraFocusToken <= 0) return
    const cam = initialCameraRef.current
    if (!cam) return
    const map = mapRef.current?.getMap()
    if (!map) return
    skipNextMoveEnd.current = true
    map.jumpTo({
      center: [cam.longitude, cam.latitude],
      zoom: cam.zoom,
    })
    bumpLayout()
  }, [cameraFocusToken, bumpLayout])

  const onMoveEnd = () => {
    // Camera settled — drop click-forced spiderfies so layout is source of truth again.
    setExpandedClusters(new Set())
    bumpLayout()
    if (skipNextMoveEnd.current) {
      skipNextMoveEnd.current = false
      return
    }
    const map = mapRef.current?.getMap()
    if (!map) return
    const c = map.getCenter()
    props.onCameraCommit({ latitude: c.lat, longitude: c.lng, zoom: map.getZoom() })
  }

  const border = props.darkMode ? '#111' : '#fff'
  const kindLabel = tooltip ? (KIND_LABELS[tooltip.kind] ?? tooltip.kind) : ''

  const hubsByKeyRef = React.useRef(hubsByKey)
  hubsByKeyRef.current = hubsByKey
  const displayPosByIdRef = React.useRef(displayPosById)
  displayPosByIdRef.current = displayPosById
  const bubbleByIdRef = React.useRef(bubbleById)
  bubbleByIdRef.current = bubbleById

  const selectPerson = React.useCallback((personId: string) => {
    setSelectedPersonId(personId)
  }, [])

  const crowdedStickyRef = React.useRef(new Set<string>())
  const crowdedPortraitIdSet = React.useMemo(() => {
    void layoutTick
    const map = mapRef.current?.getMap()
    if (!map) {
      crowdedStickyRef.current = new Set()
      return new Set<string>()
    }
    const portraits: { id: string; x: number; y: number; diameterPx: number }[] = []
    for (const marker of placedMarkers) {
      if (marker.kind !== 'individual' || marker.item.kind !== 'portrait') continue
      const p = map.project([marker.lng, marker.lat])
      portraits.push({
        id: marker.item.id,
        x: p.x,
        y: p.y,
        diameterPx: marker.item.radius,
      })
    }
    const raw = crowdedPortraitIds(portraits)
    // Hysteresis: leave crowd only when clearly sparse, so hop/pulse does not flicker.
    const prev = crowdedStickyRef.current
    const next = new Set<string>()
    for (const p of portraits) {
      let n = 0
      const r = (p.diameterPx / 2) * 1.25 * 2
      for (const q of portraits) {
        if (q.id === p.id) continue
        const dx = p.x - q.x
        const dy = p.y - q.y
        if (dx * dx + dy * dy <= r * r) n += 1
      }
      if (prev.has(p.id) ? n >= 2 : raw.has(p.id)) next.add(p.id)
    }
    crowdedStickyRef.current = next
    return next
  }, [layoutTick, placedMarkers])

  const overlayBubbles: OverlayBubble[] = React.useMemo(() => {
    const out: OverlayBubble[] = []
    for (const marker of placedMarkers) {
      if (marker.kind === 'hub') {
        const accent = marker.members[0]?.accent ?? '#5b8def'
        const baseOpacity = Math.max(...marker.members.map(m => m.opacity))
        const clusterSearchMatch = marker.members.some(m => bubbleSearchMatch(m))
        out.push({
          id: `hub:${marker.key}`,
          kind: 'hub',
          lat: marker.lat,
          lng: marker.lng,
          diameter: CLUSTER_HUB_DIAMETER,
          accent,
          border,
          opacity: composedOpacity(baseOpacity, {
            searchActive,
            searchMatch: clusterSearchMatch,
          }),
          label: String(marker.members.length),
          personId: marker.members[0]?.personId ?? '',
          memberPersonIds: marker.members.map(m => m.personId),
          count: marker.members.length,
        })
        continue
      }
      const { item, lat, lng } = marker
      const opacity = composedOpacity(item.opacity, {
        searchActive,
        searchMatch: bubbleSearchMatch(item),
      })
      const isPortrait = item.kind === 'portrait'
      const crowded = isPortrait && crowdedPortraitIdSet.has(item.id)
      const motion = props.playing === true
      out.push({
        id: item.id,
        kind: isPortrait ? 'portrait' : 'event',
        lat,
        lng,
        diameter: item.radius,
        accent: item.accent,
        border,
        opacity,
        label: item.personName || item.label,
        personId: item.personId,
        thumbnail: item.thumbnail ? `${APP_BASE}/assets/person/${item.thumbnail}` : null,
        pulse: motion && crowded,
        hop: motion && isPortrait && !crowded,
      })
    }
    return out
  }, [
    border,
    bubbleSearchMatch,
    crowdedPortraitIdSet,
    placedMarkers,
    props.playing,
    searchActive,
  ])

  React.useEffect(() => {
    const host = overlayHostRef.current
    if (!host) return
    const overlay = new MapPixiOverlay(host)
    overlayRef.current = overlay
    return () => {
      overlay.destroy()
      overlayRef.current = null
    }
  }, [])

  React.useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return
    overlay.onBubbleClick = bubble => {
      if (bubble.kind === 'hub') {
        const key = bubble.id.replace(/^hub:/, '')
        if (!hubsByKeyRef.current.has(key)) {
          setTooltip(null)
          return
        }
        setExpandedClusters(prev => {
          const next = new Set(prev)
          if (next.has(key)) next.delete(key)
          else next.add(key)
          return next
        })
        setTooltip(null)
        return
      }
      const item = bubbleByIdRef.current.get(bubble.id)
      if (!item) return
      const pos = displayPosByIdRef.current.get(item.id) ?? { lat: item.lat, lng: item.lng }
      setMarkerHover(item.personId)
      setTooltip({
        id: item.id,
        latitude: pos.lat,
        longitude: pos.lng,
        kind: item.kind,
        personName: item.personName,
        label: item.label,
        year: item.year,
      })
      selectPerson(item.personId)
      if (item.kind === 'portrait') props.onPersonClick(item.personId)
      if (item.kind === 'publication' && item.refId) {
        props.onPublicationClick(item.refId, item.personId)
      }
    }
    overlay.onBubbleHover = bubble => {
      if (!bubble) {
        setMarkerHover(null)
        if (hoverTooltips) setTooltip(null)
        return
      }
      if (bubble.kind === 'hub') return
      const item = bubbleByIdRef.current.get(bubble.id)
      if (!item) return
      setMarkerHover(item.personId)
      if (!hoverTooltips) return
      const pos = displayPosByIdRef.current.get(item.id) ?? { lat: item.lat, lng: item.lng }
      setTooltip({
        id: item.id,
        latitude: pos.lat,
        longitude: pos.lng,
        kind: item.kind,
        personName: item.personName,
        label: item.label,
        year: item.year,
      })
    }
    overlay.onPathHover = pid => setPathHoverPersonId(pid)
    overlay.onPathClick = pid => selectPerson(pid)
    overlay.onEmptyClick = () => {
      setSelectedPersonId(null)
      setTooltip(null)
      setMarkerHoverPersonId(null)
      setPathHoverPersonId(null)
    }
  }, [hoverTooltips, props.onPersonClick, props.onPublicationClick, selectPerson, setMarkerHover])

  React.useEffect(() => {
    const overlay = overlayRef.current
    const map = mapRef.current?.getMap()
    if (!overlay || !map) return
    overlay.attachMap(map)
    overlay.setBubbles(overlayBubbles)
    overlay.setPaths(props.displayAuthorsTimeline ? overlayPathSegs : [])
  }, [overlayBubbles, overlayPathSegs, props.displayAuthorsTimeline])

  React.useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return
    overlay.setHighlightedPersonId(activePersonId)
    overlay.setHighlight(
      props.displayAuthorsTimeline && highlightCoords && activePersonId
        ? {
            coordinates: highlightCoords.coordinates,
            accent: highlightCoords.accent,
            opacity:
              searchActive && !personNameMatches(activePersonId) ? SEARCH_DIM : 1,
          }
        : null,
    )
  }, [
    activePersonId,
    highlightCoords,
    personNameMatches,
    props.displayAuthorsTimeline,
    searchActive,
  ])

  const syncRafRef = React.useRef(0)
  const tooltipElRef = React.useRef<HTMLDivElement>(null)
  const tooltipRef = React.useRef(tooltip)
  tooltipRef.current = tooltip

  const placeTooltipEl = React.useCallback(() => {
    const el = tooltipElRef.current
    const tip = tooltipRef.current
    const map = mapRef.current?.getMap()
    if (!el || !tip || !map) return
    const p = map.project([tip.longitude, tip.latitude])
    el.style.left = `${p.x}px`
    el.style.top = `${p.y}px`
  }, [])

  const syncOverlay = React.useCallback(() => {
    if (syncRafRef.current) return
    syncRafRef.current = requestAnimationFrame(() => {
      syncRafRef.current = 0
      overlayRef.current?.sync()
      placeTooltipEl()
    })
  }, [placeTooltipEl])

  React.useEffect(() => {
    return () => {
      if (syncRafRef.current) cancelAnimationFrame(syncRafRef.current)
    }
  }, [])

  React.useEffect(() => {
    placeTooltipEl()
  }, [placeTooltipEl, tooltip, layoutTick])

  return (
    <div
      style={{
        height: props.windowHeight,
        position: 'relative',
        width: props.windowWidth,
      }}
    >
      <MapGl
        ref={mapRef}
        initialViewState={
          props.initialCamera ?? {
            latitude: EUROPE_FALLBACK.latitude,
            longitude: EUROPE_FALLBACK.longitude,
            zoom: EUROPE_FALLBACK.zoom,
          }
        }
        mapStyle={props.darkMode ? DARK_STYLE : LIGHT_STYLE}
        onLoad={event => {
          applyFitOrInitial()
          bumpLayout()
          const map = event.target
          const overlay = overlayRef.current
          if (overlay) overlay.attachMap(map)
          const onResize = () => {
            bumpLayout()
            syncOverlay()
          }
          map.on('resize', onResize)
        }}
        onMove={syncOverlay}
        onMoveEnd={() => {
          syncOverlay()
          onMoveEnd()
        }}
        style={{ width: '100%', height: '100%' }}
      />
      <div
        ref={overlayHostRef}
        style={{
          height: '100%',
          left: 0,
          pointerEvents: 'none',
          position: 'absolute',
          top: 0,
          width: '100%',
          zIndex: 2,
        }}
      />
      {tooltip && (
        <div
          ref={tooltipElRef}
          className={hoverTooltips ? 'map-point-popup map-point-popup--hover' : 'map-point-popup'}
          style={{
            background: '#fff',
            borderRadius: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            color: '#111827',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 12,
            left: 0,
            lineHeight: 1.35,
            maxWidth: 220,
            padding: '8px 10px',
            pointerEvents: hoverTooltips ? 'none' : 'auto',
            position: 'absolute',
            top: 0,
            transform: 'translate(-50%, calc(-100% - 12px))',
            zIndex: POPUP_Z_INDEX,
          }}
        >
          {!hoverTooltips && (
            <button
              aria-label="Close"
              onClick={() => setTooltip(null)}
              style={{
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                fontSize: 14,
                lineHeight: 1,
                position: 'absolute',
                right: 4,
                top: 2,
              }}
              type="button"
            >
              ×
            </button>
          )}
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{kindLabel}</div>
          {tooltip.personName && <div style={{ opacity: 0.85 }}>{tooltip.personName}</div>}
          {tooltip.year != null && <div style={{ opacity: 0.7 }}>{formatYear(tooltip.year)}</div>}
          {tooltip.label && tooltip.label !== tooltip.personName && (
            <div style={{ marginTop: 4 }}>{tooltip.label}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default GeographicMap
