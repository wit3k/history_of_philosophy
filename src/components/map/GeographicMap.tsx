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
} from '../../utils/lifePaths'
import {
  avatarPositionAt,
  buildAvatarTracks,
  type TemporalState,
} from '../../utils/mapTemporal'
import { clusterKey, mapAccentForBasemap, spiralOffsetDegrees } from '../../utils/mapVisual'
import { formatYear } from '../../utils/years'

const maplibreWorkerUrl = `${getAppBasePath()}/maplibre-gl-worker.mjs`
setWorkerUrl(maplibreWorkerUrl)

const LIGHT_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark'
const APP_BASE = getAppBasePath()

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

type EventItem = {
  id: string
  kind: string
  lat: number
  lng: number
  accent: string
  opacity: number
  personName: string
  label: string
  year: number | null
  radius: number
}

type PortraitItem = {
  personId: string
  name: string
  accent: string
  thumbnail: string | null
  lat: number
  lng: number
  opacity: number
}

type PointTooltip = {
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
  onActivate: (itemId: string, event: React.MouseEvent) => void
}) {
  return (
    <button
      data-item-id={props.itemId}
      title={props.title}
      onClick={event => props.onActivate(props.itemId, event)}
      style={{
        background: props.accent,
        border: `2px solid ${props.border}`,
        borderRadius: '50%',
        boxShadow: '0 1px 4px rgba(0,0,0,0.45)',
        cursor: 'pointer',
        height: props.size,
        opacity: props.opacity,
        overflow: 'hidden',
        padding: 0,
        pointerEvents: props.opacity < 0.05 ? 'none' : 'auto',
        width: props.size,
      }}
      type="button"
    />
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
        color: '#fff',
        cursor: 'pointer',
        display: 'flex',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        fontWeight: 800,
        height: 34,
        justifyContent: 'center',
        opacity: props.opacity,
        width: 34,
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
  onActivate: (personId: string, event: React.MouseEvent) => void
}) {
  return (
    <button
      title={props.name}
      onClick={event => props.onActivate(props.personId, event)}
      style={{
        background: props.accent,
        border: `2px solid ${props.border}`,
        borderRadius: '50%',
        boxShadow: '0 1px 4px rgba(0,0,0,0.45)',
        cursor: 'pointer',
        height: 28,
        opacity: props.opacity,
        overflow: 'hidden',
        padding: 0,
        pointerEvents: props.opacity < 0.05 ? 'none' : 'auto',
        width: 28,
      }}
      type="button"
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
    </button>
  )
})

const GeographicMap = (props: GeographicMapProps) => {
  const mapRef = React.useRef<MapRef>(null)
  const fittedForKey = React.useRef<string | null>(null)
  const skipNextMoveEnd = React.useRef(false)
  const [tooltip, setTooltip] = React.useState<PointTooltip | null>(null)
  const [expandedClusters, setExpandedClusters] = React.useState<Set<string>>(() => new Set())

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

  // Static event markers only — never mix moving portraits into clusters.
  const eventItems = React.useMemo(() => {
    const items: EventItem[] = []
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
      items.push({
        id: `${f.properties.kind}:${f.properties.personId}:${f.properties.refId ?? f.properties.label}:${year}`,
        kind: String(f.properties.kind ?? ''),
        lat,
        lng,
        accent: String(f.properties.accent ?? '#888'),
        opacity,
        personName: String(f.properties.personName ?? ''),
        label: String(f.properties.label ?? ''),
        year,
        radius: kindRadius(String(f.properties.kind ?? '')),
      })
    }
    return items
  }, [geojson])

  const portraits = React.useMemo(() => {
    if (!props.displayAuthors) return [] as PortraitItem[]
    const out: PortraitItem[] = []
    for (const track of avatarTracks) {
      const pos = avatarPositionAt(track, props.temporal)
      if (!pos || pos.opacity < 0.02) continue
      out.push({
        personId: track.personId,
        name: track.name,
        accent: mapAccentForBasemap(track.accent, props.darkMode),
        thumbnail: track.thumbnail,
        lat: pos.lat,
        lng: pos.lng,
        opacity: pos.opacity,
      })
    }
    return out
  }, [avatarTracks, props.displayAuthors, props.temporal, props.darkMode])

  const eventClusters = React.useMemo(() => {
    const groups = new Map<string, EventItem[]>()
    for (const item of eventItems) {
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
  }, [eventItems])

  // Only collapse clusters when the selected range/mode changes — not every playhead tick.
  React.useEffect(() => {
    setExpandedClusters(new Set())
    setTooltip(null)
  }, [props.temporal.yearFrom, props.temporal.yearTo, props.temporal.mode])

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

  const onMoveEnd = () => {
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

  const eventClustersRef = React.useRef(eventClusters)
  eventClustersRef.current = eventClusters

  const onClusterActivate = React.useCallback((key: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setExpandedClusters(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    setTooltip(null)
  }, [])

  const onEventActivate = React.useCallback((itemId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    for (const group of eventClustersRef.current) {
      const expanded = expandedClusters.has(group.key)
      const index = group.members.findIndex(m => m.id === itemId)
      if (index < 0) continue
      const item = group.members[index]
      const offset =
        expanded && group.members.length > 1
          ? spiralOffsetDegrees(index, group.members.length)
          : { dLat: 0, dLng: 0 }
      setTooltip({
        latitude: item.lat + offset.dLat,
        longitude: item.lng + offset.dLng,
        kind: item.kind,
        personName: item.personName,
        label: item.label,
        year: item.year,
      })
      return
    }
  }, [expandedClusters])

  const onPortraitActivate = React.useCallback(
    (personId: string, event: React.MouseEvent) => {
      event.stopPropagation()
      setTooltip(null)
      props.onPersonClick(personId)
    },
    [props.onPersonClick],
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
        mapStyle={props.darkMode ? DARK_STYLE : LIGHT_STYLE}
        onClick={() => {
          setExpandedClusters(new Set())
          setTooltip(null)
        }}
        onLoad={applyFitOrInitial}
        onMoveEnd={onMoveEnd}
        style={{ width: '100%', height: '100%' }}
      >
        <Source id="life-paths" type="geojson" data={pathGeoJson}>
          <Layer
            id="life-path-lines"
            type="line"
            filter={['==', ['get', 'kind'], 'path']}
            paint={{
              'line-color': ['get', 'accent'],
              'line-width': 3.25,
              'line-opacity': ['coalesce', ['get', 'opacity'], 0.85],
            }}
            layout={{
              'line-cap': 'round',
              'line-join': 'round',
            }}
          />
        </Source>

        {eventClusters.flatMap(group => {
          const expanded = expandedClusters.has(group.key)
          if (!expanded && group.members.length > 1) {
            const accent = group.members[0]?.accent ?? '#5b8def'
            const opacity = Math.max(...group.members.map(m => m.opacity))
            return [
              <Marker
                key={`cluster:${group.key}`}
                anchor="center"
                latitude={group.lat}
                longitude={group.lng}
                style={{ zIndex: 10 }}
              >
                <ClusterBubble
                  accent={accent}
                  border={border}
                  clusterKey={group.key}
                  count={group.members.length}
                  opacity={opacity}
                  onActivate={onClusterActivate}
                />
              </Marker>,
            ]
          }

          return group.members.map((item, index) => {
            const offset =
              expanded && group.members.length > 1
                ? spiralOffsetDegrees(index, group.members.length)
                : { dLat: 0, dLng: 0 }
            const lat = item.lat + offset.dLat
            const lng = item.lng + offset.dLng
            return (
              <Marker key={item.id} anchor="center" latitude={lat} longitude={lng} style={{ zIndex: 10 }}>
                <EventBubble
                  accent={item.accent}
                  border={border}
                  itemId={item.id}
                  opacity={item.opacity}
                  size={item.radius}
                  title={item.personName || item.label}
                  onActivate={onEventActivate}
                />
              </Marker>
            )
          })
        })}

        {portraits.map(p => (
          <Marker
            key={`portrait:${p.personId}`}
            anchor="center"
            latitude={p.lat}
            longitude={p.lng}
            style={{ zIndex: 30 }}
          >
            <PortraitBubble
              accent={p.accent}
              border={border}
              name={p.name}
              opacity={p.opacity}
              personId={p.personId}
              thumbnail={p.thumbnail}
              onActivate={onPortraitActivate}
            />
          </Marker>
        ))}

        {tooltip && (
          <Popup
            anchor="bottom"
            closeButton
            closeOnClick={false}
            latitude={tooltip.latitude}
            longitude={tooltip.longitude}
            maxWidth="240px"
            offset={12}
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
