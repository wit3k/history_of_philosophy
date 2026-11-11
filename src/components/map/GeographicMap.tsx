import { setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import React from 'react'
import MapGl, { Layer, Marker, Popup, Source, type MapRef } from 'react-map-gl/maplibre'
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
  type TemporalState,
} from '../../utils/mapTemporal'
import {
  clusterAutoExpandZoom,
  clusterKey,
  clusterRingPixelOffsets,
  isClusterAutoExpanded,
  isLightHex,
  mapAccentForBasemap,
} from '../../utils/mapVisual'
import { formatYear } from '../../utils/years'

const CLUSTER_HUB_DIAMETER = 34
const POPUP_Z_INDEX = 1000
const HOVER_TOOLTIP_MEDIA = '(hover: hover) and (pointer: fine)'
/** Match diagram relation fade while something is highlighted. */
const HIGHLIGHT_DIM = 0.1
/** MapLibre dasharray phases — marches along the line (oldest → newest). */
const LINE_DASH_SEQUENCE: number[][] = [
  [0, 4, 3],
  [0.5, 4, 2.5],
  [1, 4, 2],
  [1.5, 4, 1.5],
  [2, 4, 1],
  [2.5, 4, 0.5],
  [3, 4, 0],
  [0, 0.5, 3, 3.5],
  [0, 1, 3, 3],
  [0, 1.5, 3, 2.5],
  [0, 2, 3, 2],
  [0, 2.5, 3, 1.5],
  [0, 3, 3, 1],
  [0, 3.5, 3, 0.5],
]

function BubbleDashRing(props: { size: number; color: string }) {
  const r = props.size / 2 + 1
  const c = props.size / 2
  return (
    <svg
      height={props.size}
      width={props.size}
      style={{
        height: props.size,
        left: 0,
        overflow: 'visible',
        pointerEvents: 'none',
        position: 'absolute',
        top: 0,
        width: props.size,
      }}
    >
      <circle
        className="map-bubble-dash-ring"
        cx={c}
        cy={c}
        fill="none"
        r={r}
        stroke={props.color}
        strokeDasharray="6 4"
        strokeLinecap="butt"
        strokeWidth={2.5}
      />
    </svg>
  )
}

function visualOpacity(base: number, highlighted: boolean, highlightsOn: boolean): number {
  if (!highlightsOn) return base
  return highlighted ? base : base * HIGHLIGHT_DIM
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
  temporal: TemporalState
  initialCamera: MapCamera | null
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

const EventBubble = React.memo(function EventBubble(props: {
  itemId: string
  size: number
  accent: string
  border: string
  opacity: number
  title: string
  highlighted: boolean
  hoverTooltips: boolean
  onActivate: (itemId: string, event: React.MouseEvent) => void
  onHoverEnter?: (itemId: string) => void
  onHoverLeave?: (itemId: string) => void
}) {
  return (
    <button
      data-item-id={props.itemId}
      title={props.hoverTooltips ? undefined : props.title}
      onClick={event => props.onActivate(props.itemId, event)}
      onMouseEnter={props.onHoverEnter ? () => props.onHoverEnter?.(props.itemId) : undefined}
      onMouseLeave={props.onHoverLeave ? () => props.onHoverLeave?.(props.itemId) : undefined}
      style={{
        background: props.accent,
        border: props.highlighted ? `2px solid transparent` : `2px solid ${props.border}`,
        borderRadius: '50%',
        boxShadow: '0 1px 4px rgba(0,0,0,0.45)',
        cursor: 'pointer',
        height: props.size,
        opacity: props.opacity,
        overflow: 'visible',
        padding: 0,
        pointerEvents: props.opacity < 0.05 ? 'none' : 'auto',
        position: 'relative',
        width: props.size,
      }}
      type="button"
    >
      {props.highlighted && <BubbleDashRing color={props.accent} size={props.size} />}
    </button>
  )
})

const ClusterBubble = React.memo(function ClusterBubble(props: {
  clusterKey: string
  count: number
  accent: string
  border: string
  opacity: number
  onActivate: (clusterKey: string, event: React.MouseEvent) => void
}) {
  const labelColor = isLightHex(props.accent) ? '#111' : '#fff'
  return (
    <button
      aria-label={`${props.count} elementów`}
      onClick={event => props.onActivate(props.clusterKey, event)}
      style={{
        alignItems: 'center',
        background: props.accent,
        border: `2px solid ${props.border}`,
        borderRadius: '50%',
        boxShadow: '0 1px 4px rgba(0,0,0,0.45)',
        color: labelColor,
        cursor: 'pointer',
        display: 'flex',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        fontWeight: 800,
        height: CLUSTER_HUB_DIAMETER,
        justifyContent: 'center',
        opacity: props.opacity,
        width: CLUSTER_HUB_DIAMETER,
      }}
      type="button"
    >
      {props.count}
    </button>
  )
})

const PortraitBubble = React.memo(function PortraitBubble(props: {
  personId: string
  name: string
  accent: string
  border: string
  opacity: number
  thumbnail: string | null
  highlighted: boolean
  hoverTooltips: boolean
  onActivate: (personId: string, event: React.MouseEvent) => void
  onHoverEnter?: (personId: string) => void
  onHoverLeave?: (personId: string) => void
}) {
  return (
    <button
      title={props.hoverTooltips ? undefined : props.name}
      onClick={event => props.onActivate(props.personId, event)}
      onMouseEnter={props.onHoverEnter ? () => props.onHoverEnter?.(props.personId) : undefined}
      onMouseLeave={props.onHoverLeave ? () => props.onHoverLeave?.(props.personId) : undefined}
      style={{
        background: props.accent,
        border: props.highlighted ? `2px solid transparent` : `2px solid ${props.border}`,
        borderRadius: '50%',
        boxShadow: '0 1px 4px rgba(0,0,0,0.45)',
        cursor: 'pointer',
        height: 28,
        opacity: props.opacity,
        overflow: 'visible',
        padding: 0,
        pointerEvents: props.opacity < 0.05 ? 'none' : 'auto',
        position: 'relative',
        width: 28,
      }}
      type="button"
    >
      <span
        style={{
          borderRadius: '50%',
          display: 'block',
          height: '100%',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {props.thumbnail ? (
          <img
            alt=""
            draggable={false}
            src={`${APP_BASE}/assets/person/${props.thumbnail}`}
            style={{ display: 'block', height: '100%', objectFit: 'cover', width: '100%' }}
          />
        ) : (
          <span
            style={{
              alignItems: 'center',
              color: '#fff',
              display: 'flex',
              fontSize: 11,
              fontWeight: 700,
              height: '100%',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            {props.name.slice(0, 1)}
          </span>
        )}
      </span>
      {props.highlighted && <BubbleDashRing color={props.accent} size={28} />}
    </button>
  )
})

const GeographicMap = (props: GeographicMapProps) => {
  const mapRef = React.useRef<MapRef>(null)
  const fittedForKey = React.useRef<string | null>(null)
  const skipNextMoveEnd = React.useRef(false)
  const [tooltip, setTooltip] = React.useState<PointTooltip | null>(null)
  const [expandedClusters, setExpandedClusters] = React.useState<Set<string>>(() => new Set())
  const [layoutTick, setLayoutTick] = React.useState(0)
  const [mapZoom, setMapZoom] = React.useState(
    () => props.initialCamera?.zoom ?? EUROPE_FALLBACK.zoom,
  )
  const [hoverTooltips, setHoverTooltips] = React.useState(canHoverTooltips)
  const [selectedPersonId, setSelectedPersonId] = React.useState<string | null>(null)
  const [markerHoverPersonId, setMarkerHoverPersonId] = React.useState<string | null>(null)
  const [pathHoverPersonId, setPathHoverPersonId] = React.useState<string | null>(null)
  const expandedClustersRef = React.useRef(expandedClusters)
  expandedClustersRef.current = expandedClusters
  const mapZoomRef = React.useRef(mapZoom)
  mapZoomRef.current = mapZoom
  const clearMarkerHoverTimer = React.useRef<number | null>(null)

  // Sticky click selection wins; hover only previews when nothing is selected.
  const activePersonId = selectedPersonId ?? markerHoverPersonId ?? pathHoverPersonId
  const highlightsOn = activePersonId != null

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
        temporal: props.temporal,
        darkMode: props.darkMode,
      }),
    [
      paths,
      props.displayAuthors,
      props.displayAuthorsTimeline,
      props.displayPublications,
      props.displayPersonHistoryEvents,
      props.temporal,
      props.darkMode,
    ],
  )

  const pathGeoJson = React.useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: geojson.features.filter(f => f.properties.kind === 'path'),
    }),
    [geojson],
  )

  const highlightPathGeoJson = React.useMemo(() => {
    if (!activePersonId) return null
    const path = paths.find(p => p.personId === activePersonId)
    if (!path) return null
    const coordinates = personLifeLineCoordinates(path, {
      showPublications: props.displayPublications,
      showPersonal: props.displayPersonHistoryEvents,
    })
    if (coordinates.length < 2) return null
    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: {
            personId: path.personId,
            accent: mapAccentForBasemap(path.accent, props.darkMode),
          },
          geometry: {
            type: 'LineString' as const,
            coordinates,
          },
        },
      ],
    }
  }, [
    activePersonId,
    paths,
    props.displayPublications,
    props.displayPersonHistoryEvents,
    props.darkMode,
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
        const pos = avatarPositionAt(track, props.temporal)
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
    props.temporal,
    props.darkMode,
  ])

  const mapClusters = React.useMemo(() => {
    const groups = new Map<string, MapBubbleItem[]>()
    for (const item of mapBubbles) {
      const key = clusterKey(item.lat, item.lng)
      const list = groups.get(key) ?? []
      list.push(item)
      groups.set(key, list)
    }
    return [...groups.entries()].map(([key, members]) => ({
      key,
      // Anchor to first member's exact coords so the cluster key stays stable.
      lat: members[0].lat,
      lng: members[0].lng,
      members,
    }))
  }, [mapBubbles])

  // Only collapse manual expands when the selected range/mode changes — not every playhead tick.
  React.useEffect(() => {
    setExpandedClusters(new Set())
    setTooltip(null)
    setSelectedPersonId(null)
  }, [props.temporal.yearFrom, props.temporal.yearTo, props.temporal.mode])

  // After zooming out past a pile's auto threshold, drop its manual expand too.
  React.useEffect(() => {
    setExpandedClusters(prev => {
      if (prev.size === 0) return prev
      let changed = false
      const next = new Set(prev)
      for (const group of mapClusters) {
        if (!prev.has(group.key)) continue
        const collapseBelow = clusterAutoExpandZoom(group.members.length) - 0.75
        if (mapZoom < collapseBelow) {
          next.delete(group.key)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [mapZoom, mapClusters])

  const fitKey = React.useMemo(
    () =>
      `${props.peopleList.map(p => p.id).join(',')}|${props.displayAuthors}|${props.displayPublications}|${props.displayPersonHistoryEvents}`,
    [props.peopleList, props.displayAuthors, props.displayPublications, props.displayPersonHistoryEvents],
  )

  const applyFitOrInitial = React.useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    if (props.initialCamera) {
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

    skipNextMoveEnd.current = true
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

  React.useEffect(() => {
    if (props.initialCamera) {
      fittedForKey.current = fitKey
      return
    }
    fittedForKey.current = null
    applyFitOrInitial()
  }, [applyFitOrInitial, fitKey, props.initialCamera])

  const syncMapZoom = React.useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    const zoom = map.getZoom()
    if (Math.abs(zoom - mapZoomRef.current) > 0.01) setMapZoom(zoom)
  }, [])

  const onMoveEnd = () => {
    syncMapZoom()
    if (skipNextMoveEnd.current) {
      skipNextMoveEnd.current = false
      const map = mapRef.current?.getMap()
      if (map) {
        const c = map.getCenter()
        props.onCameraCommit({ latitude: c.lat, longitude: c.lng, zoom: map.getZoom() })
      }
      return
    }
    const map = mapRef.current?.getMap()
    if (!map) return
    const c = map.getCenter()
    props.onCameraCommit({ latitude: c.lat, longitude: c.lng, zoom: map.getZoom() })
  }

  const border = props.darkMode ? '#111' : '#fff'
  const kindLabel = tooltip ? (KIND_LABELS[tooltip.kind] ?? tooltip.kind) : ''

  const mapClustersRef = React.useRef(mapClusters)
  mapClustersRef.current = mapClusters

  const expandedMemberPositions = React.useCallback(
    (group: { lat: number; lng: number; members: MapBubbleItem[] }) => {
      void layoutTick
      const map = mapRef.current?.getMap()
      const bubbleDiameter = Math.max(...group.members.map(m => m.radius), 12)
      const offsets = clusterRingPixelOffsets(
        group.members.length,
        bubbleDiameter,
        CLUSTER_HUB_DIAMETER,
      )
      if (!map) {
        return group.members.map(m => ({ lat: m.lat, lng: m.lng }))
      }
      const origin = map.project([group.lng, group.lat])
      return offsets.map(o => {
        const ll = map.unproject([origin.x + o.x, origin.y + o.y])
        return { lat: ll.lat, lng: ll.lng }
      })
    },
    [layoutTick],
  )

  const findBubble = React.useCallback((itemId: string) => {
    for (const group of mapClustersRef.current) {
      const index = group.members.findIndex(m => m.id === itemId)
      if (index < 0) continue
      return { group, index, item: group.members[index] }
    }
    return null
  }, [])

  React.useEffect(() => {
    if (!highlightPathGeoJson) return
    const map = mapRef.current?.getMap()
    if (!map) return
    let step = -1
    let raf = 0
    const tick = (ts: number) => {
      const next = Math.floor(ts / 50) % LINE_DASH_SEQUENCE.length
      if (next !== step && map.getLayer('life-path-dash')) {
        step = next
        map.setPaintProperty('life-path-dash', 'line-dasharray', LINE_DASH_SEQUENCE[next])
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [highlightPathGeoJson])

  const onClusterActivate = React.useCallback((key: string, event: React.MouseEvent) => {
    event.stopPropagation()
    const group = mapClustersRef.current.find(g => g.key === key)
    // Already open from zoom — keep it; click-to-collapse only applies when zoomed out.
    if (group && isClusterAutoExpanded(mapZoomRef.current, group.members.length)) {
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
  }, [])

  const isGroupExpanded = React.useCallback(
    (group: { key: string; members: MapBubbleItem[] }) => {
      if (group.members.length <= 1) return false
      return (
        isClusterAutoExpanded(mapZoomRef.current, group.members.length) ||
        expandedClustersRef.current.has(group.key)
      )
    },
    [],
  )

  const showBubbleTooltip = React.useCallback(
    (itemId: string) => {
      const found = findBubble(itemId)
      if (!found) return
      const { group, index, item } = found
      const expanded = isGroupExpanded(group)
      const positions =
        expanded && group.members.length > 1 ? expandedMemberPositions(group) : null
      const pos = positions?.[index] ?? { lat: item.lat, lng: item.lng }
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
      return item
    },
    [expandedMemberPositions, findBubble, isGroupExpanded, setMarkerHover],
  )

  const clearTooltipFor = React.useCallback((id: string) => {
    setTooltip(prev => (prev?.id === id ? null : prev))
  }, [])

  const selectPerson = React.useCallback((personId: string) => {
    setSelectedPersonId(personId)
  }, [])

  const onEventActivate = React.useCallback(
    (itemId: string, event: React.MouseEvent) => {
      event.stopPropagation()
      const item = showBubbleTooltip(itemId)
      if (!item) return
      selectPerson(item.personId)
      if (item.kind === 'publication' && item.refId) {
        props.onPublicationClick(item.refId, item.personId)
      }
    },
    [props.onPublicationClick, selectPerson, showBubbleTooltip],
  )

  const onEventHoverEnter = React.useCallback(
    (itemId: string) => {
      const found = findBubble(itemId)
      if (!found) return
      setMarkerHover(found.item.personId)
      if (hoverTooltips) showBubbleTooltip(itemId)
    },
    [findBubble, hoverTooltips, setMarkerHover, showBubbleTooltip],
  )

  const onEventHoverLeave = React.useCallback(
    (itemId: string) => {
      if (hoverTooltips) clearTooltipFor(itemId)
      setMarkerHover(null)
    },
    [clearTooltipFor, hoverTooltips, setMarkerHover],
  )

  const onPortraitHoverEnter = React.useCallback(
    (personId: string) => {
      const itemId = `portrait:${personId}`
      const found = findBubble(itemId)
      if (!found) return
      setMarkerHover(personId)
      if (hoverTooltips) showBubbleTooltip(itemId)
    },
    [findBubble, hoverTooltips, setMarkerHover, showBubbleTooltip],
  )

  const onPortraitHoverLeave = React.useCallback(
    (personId: string) => {
      if (hoverTooltips) clearTooltipFor(`portrait:${personId}`)
      setMarkerHover(null)
    },
    [clearTooltipFor, hoverTooltips, setMarkerHover],
  )

  const onPortraitActivate = React.useCallback(
    (personId: string, event: React.MouseEvent) => {
      event.stopPropagation()
      setTooltip(null)
      selectPerson(personId)
      props.onPersonClick(personId)
    },
    [props.onPersonClick, selectPerson],
  )

  const onPathMouseMove = React.useCallback(
    (event: { features?: { properties?: { personId?: unknown } }[] }) => {
      const pid = event.features?.[0]?.properties?.personId
      setPathHoverPersonId(pid != null && pid !== '' ? String(pid) : null)
    },
    [],
  )

  const onMapClick = React.useCallback(
    (event: { features?: { properties?: { personId?: unknown } }[] }) => {
      const pid = event.features?.[0]?.properties?.personId
      if (pid != null && pid !== '') {
        selectPerson(String(pid))
        return
      }
      setSelectedPersonId(null)
      setTooltip(null)
      setMarkerHoverPersonId(null)
      setPathHoverPersonId(null)
    },
    [selectPerson],
  )

  return (
    <div style={{ height: props.windowHeight, width: props.windowWidth }}>
      <MapGl
        ref={mapRef}
        initialViewState={
          props.initialCamera ?? {
            latitude: EUROPE_FALLBACK.latitude,
            longitude: EUROPE_FALLBACK.longitude,
            zoom: EUROPE_FALLBACK.zoom,
          }
        }
        interactiveLayerIds={['life-path-hit']}
        mapStyle={props.darkMode ? DARK_STYLE : LIGHT_STYLE}
        onClick={onMapClick}
        onLoad={() => {
          applyFitOrInitial()
          syncMapZoom()
        }}
        onMouseLeave={() => setPathHoverPersonId(null)}
        onMouseMove={onPathMouseMove}
        onMove={() => {
          syncMapZoom()
          setLayoutTick(t => t + 1)
        }}
        onMoveEnd={onMoveEnd}
        style={{ width: '100%', height: '100%' }}
      >
        <Source id="life-paths" type="geojson" data={pathGeoJson}>
          <Layer
            id="life-path-lines"
            type="line"
            filter={
              activePersonId && highlightPathGeoJson
                ? [
                    'all',
                    ['==', ['get', 'kind'], 'path'],
                    ['!=', ['get', 'personId'], activePersonId],
                  ]
                : ['==', ['get', 'kind'], 'path']
            }
            paint={{
              'line-color': ['get', 'accent'],
              'line-width': [
                'case',
                ['==', ['get', 'personId'], activePersonId ?? ''],
                4,
                3.25,
              ],
              'line-opacity': highlightsOn
                ? [
                    'case',
                    ['==', ['get', 'personId'], activePersonId ?? ''],
                    ['coalesce', ['get', 'opacity'], 0.85],
                    ['*', ['coalesce', ['get', 'opacity'], 0.85], HIGHLIGHT_DIM],
                  ]
                : ['coalesce', ['get', 'opacity'], 0.85],
            }}
            layout={{
              'line-cap': 'round',
              'line-join': 'round',
            }}
          />
          <Layer
            id="life-path-hit"
            type="line"
            filter={['==', ['get', 'kind'], 'path']}
            paint={{
              'line-color': '#000',
              'line-opacity': 0,
              'line-width': 14,
            }}
            layout={{
              'line-cap': 'round',
              'line-join': 'round',
            }}
          />
        </Source>

        {highlightPathGeoJson && (
          <Source id="life-path-highlight" type="geojson" data={highlightPathGeoJson}>
            <Layer
              id="life-path-dash"
              type="line"
              paint={{
                'line-color': ['get', 'accent'],
                'line-dasharray': LINE_DASH_SEQUENCE[0],
                'line-opacity': 1,
                'line-width': 4,
              }}
              layout={{
                'line-cap': 'butt',
                'line-join': 'round',
              }}
            />
          </Source>
        )}

        {mapClusters.flatMap(group => {
          const expanded =
            group.members.length > 1 &&
            (isClusterAutoExpanded(mapZoom, group.members.length) ||
              expandedClusters.has(group.key))
          const renderBubble = (item: MapBubbleItem, lat: number, lng: number, zIndex: number) => {
            const highlighted = activePersonId === item.personId
            const opacity = visualOpacity(item.opacity, highlighted, highlightsOn)
            if (item.kind === 'portrait') {
              return (
                <Marker
                  key={item.id}
                  anchor="center"
                  latitude={lat}
                  longitude={lng}
                  style={{ zIndex: highlighted ? Math.max(zIndex, 40) : zIndex }}
                >
                  <PortraitBubble
                    accent={item.accent}
                    border={border}
                    highlighted={highlighted}
                    hoverTooltips={hoverTooltips}
                    name={item.personName}
                    opacity={opacity}
                    personId={item.personId}
                    thumbnail={item.thumbnail}
                    onActivate={onPortraitActivate}
                    onHoverEnter={onPortraitHoverEnter}
                    onHoverLeave={onPortraitHoverLeave}
                  />
                </Marker>
              )
            }
            return (
              <Marker
                key={item.id}
                anchor="center"
                latitude={lat}
                longitude={lng}
                style={{ zIndex: highlighted ? Math.max(zIndex, 20) : zIndex }}
              >
                <EventBubble
                  accent={item.accent}
                  border={border}
                  highlighted={highlighted}
                  hoverTooltips={hoverTooltips}
                  itemId={item.id}
                  opacity={opacity}
                  size={item.radius}
                  title={item.personName || item.label}
                  onActivate={onEventActivate}
                  onHoverEnter={onEventHoverEnter}
                  onHoverLeave={onEventHoverLeave}
                />
              </Marker>
            )
          }

          if (group.members.length <= 1) {
            const item = group.members[0]
            if (!item) return []
            return [renderBubble(item, item.lat, item.lng, item.kind === 'portrait' ? 30 : 10)]
          }

          const accent = group.members[0]?.accent ?? '#5b8def'
          const opacity = Math.max(...group.members.map(m => m.opacity))
          const clusterHot = group.members.some(m => m.personId === activePersonId)
          const hub = (
            <Marker
              key={`cluster:${group.key}`}
              anchor="center"
              latitude={group.lat}
              longitude={group.lng}
              style={{ zIndex: 12 }}
            >
              <ClusterBubble
                accent={accent}
                border={border}
                clusterKey={group.key}
                count={group.members.length}
                opacity={visualOpacity(opacity, clusterHot, highlightsOn)}
                onActivate={onClusterActivate}
              />
            </Marker>
          )

          if (!expanded) return [hub]

          const positions = expandedMemberPositions(group)
          return [
            hub,
            ...group.members.map((item, index) => {
              const pos = positions[index] ?? { lat: item.lat, lng: item.lng }
              return renderBubble(item, pos.lat, pos.lng, item.kind === 'portrait' ? 31 : 11)
            }),
          ]
        })}

        {tooltip && (
          <Popup
            anchor="bottom"
            className={hoverTooltips ? 'map-point-popup map-point-popup--hover' : 'map-point-popup'}
            closeButton={!hoverTooltips}
            closeOnClick={false}
            latitude={tooltip.latitude}
            longitude={tooltip.longitude}
            maxWidth="240px"
            offset={12}
            style={{ zIndex: POPUP_Z_INDEX }}
            onClose={() => setTooltip(null)}
          >
            <div
              style={{
                color: '#111827',
                fontFamily: 'system-ui, sans-serif',
                fontSize: 12,
                lineHeight: 1.35,
                maxWidth: 220,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{kindLabel}</div>
              {tooltip.personName && <div style={{ opacity: 0.85 }}>{tooltip.personName}</div>}
              {tooltip.year != null && <div style={{ opacity: 0.7 }}>{formatYear(tooltip.year)}</div>}
              {tooltip.label && tooltip.label !== tooltip.personName && (
                <div style={{ marginTop: 4 }}>{tooltip.label}</div>
              )}
            </div>
          </Popup>
        )}
      </MapGl>
    </div>
  )
}

export default GeographicMap
