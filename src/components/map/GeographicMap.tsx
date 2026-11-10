import { setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import React from 'react'
import Map, { Layer, Popup, Source, type MapRef } from 'react-map-gl/maplibre'
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

// MapLibre v6 loads a separate worker module. Without an explicit URL the
// default resolves next to the page path (e.g. /map/...), SPA fallback returns
// HTML, and the browser blocks it as MIME text/html.
const maplibreWorkerUrl = `${getAppBasePath()}/maplibre-gl-worker.mjs`
setWorkerUrl(maplibreWorkerUrl)

const LIGHT_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark'

const EUROPE_FALLBACK = {
  latitude: 50,
  longitude: 10,
  zoom: 3.2,
}

const POINT_LAYER_ID = 'life-path-points'

const KIND_LABELS: Record<string, string> = {
  birth: 'Narodziny',
  death: 'Śmierć',
  publication: 'Publikacja',
  personal: 'Wydarzenie osobiste',
}

export type MapCamera = {
  latitude: number
  longitude: number
  zoom: number
}

type PointTooltip = {
  longitude: number
  latitude: number
  kind: string
  personName: string
  label: string
  year: number | null
  pinned: boolean
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
  initialCamera: MapCamera | null
  onCameraCommit: (camera: MapCamera) => void
  windowWidth: number
  windowHeight: number
}

function tooltipFromFeature(
  feature: maplibregl.MapGeoJSONFeature,
  longitude: number,
  latitude: number,
  pinned: boolean,
): PointTooltip | null {
  const props = feature.properties
  if (!props || props.kind === 'path') return null
  const yearRaw = props.year
  const year =
    yearRaw == null || yearRaw === ''
      ? null
      : Number.isFinite(Number(yearRaw))
        ? Number(yearRaw)
        : null
  return {
    longitude,
    latitude,
    kind: String(props.kind ?? ''),
    personName: String(props.personName ?? ''),
    label: String(props.label ?? ''),
    year,
    pinned,
  }
}

const GeographicMap = (props: GeographicMapProps) => {
  const mapRef = React.useRef<MapRef>(null)
  const fittedForKey = React.useRef<string | null>(null)
  const skipNextMoveEnd = React.useRef(false)
  const [tooltip, setTooltip] = React.useState<PointTooltip | null>(null)

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

  const geojson = React.useMemo(
    () =>
      lifePathsToGeoJson(paths, {
        showAuthors: props.displayAuthors,
        showLifelines: props.displayAuthorsTimeline,
        showPublications: props.displayPublications,
        showPersonal: props.displayPersonHistoryEvents,
      }),
    [
      paths,
      props.displayAuthors,
      props.displayAuthorsTimeline,
      props.displayPublications,
      props.displayPersonHistoryEvents,
    ],
  )

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
    // Re-fit when collection filter changes and URL has no camera.
    if (props.initialCamera) {
      fittedForKey.current = fitKey
      return
    }
    fittedForKey.current = null
    applyFitOrInitial()
  }, [applyFitOrInitial, fitKey, props.initialCamera])

  React.useEffect(() => {
    setTooltip(null)
  }, [geojson])

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

  const queryPoint = (event: { point: { x: number; y: number }; lngLat: { lng: number; lat: number } }) => {
    const map = mapRef.current?.getMap()
    if (!map || !map.getLayer(POINT_LAYER_ID)) return null
    const features = map.queryRenderedFeatures(event.point, { layers: [POINT_LAYER_ID] })
    const feature = features[0]
    if (!feature) return null
    return tooltipFromFeature(feature, event.lngLat.lng, event.lngLat.lat, false)
  }

  const onMouseMove = (event: maplibregl.MapLayerMouseEvent) => {
    if (tooltip?.pinned) return
    const next = queryPoint(event)
    const map = mapRef.current?.getMap()
    if (map) map.getCanvas().style.cursor = next ? 'pointer' : ''
    setTooltip(next)
  }

  const onMouseLeave = () => {
    if (tooltip?.pinned) return
    const map = mapRef.current?.getMap()
    if (map) map.getCanvas().style.cursor = ''
    setTooltip(null)
  }

  const onClick = (event: maplibregl.MapLayerMouseEvent) => {
    const next = queryPoint(event)
    if (next) {
      setTooltip({ ...next, pinned: true })
      return
    }
    // Tap/click empty map dismisses a pinned (mobile) tooltip.
    setTooltip(null)
  }

  const kindLabel = tooltip ? (KIND_LABELS[tooltip.kind] ?? tooltip.kind) : ''

  return (
    <div style={{ height: props.windowHeight, width: props.windowWidth }}>
      <Map
        ref={mapRef}
        initialViewState={
          props.initialCamera ?? {
            latitude: EUROPE_FALLBACK.latitude,
            longitude: EUROPE_FALLBACK.longitude,
            zoom: EUROPE_FALLBACK.zoom,
          }
        }
        interactiveLayerIds={[POINT_LAYER_ID]}
        mapStyle={props.darkMode ? DARK_STYLE : LIGHT_STYLE}
        onClick={onClick}
        onLoad={applyFitOrInitial}
        onMouseLeave={onMouseLeave}
        onMouseMove={onMouseMove}
        onMoveEnd={onMoveEnd}
        style={{ width: '100%', height: '100%' }}
        attributionControl
      >
        <Source id="life-paths" type="geojson" data={geojson}>
          <Layer
            id="life-path-lines"
            type="line"
            filter={['==', ['get', 'kind'], 'path']}
            paint={{
              'line-color': ['get', 'accent'],
              'line-width': 2.5,
              'line-opacity': 0.85,
            }}
            layout={{
              'line-cap': 'round',
              'line-join': 'round',
            }}
          />
          <Layer
            id={POINT_LAYER_ID}
            type="circle"
            filter={['!=', ['get', 'kind'], 'path']}
            paint={{
              'circle-radius': [
                'match',
                ['get', 'kind'],
                'birth',
                7,
                'death',
                7,
                'publication',
                5,
                'personal',
                6,
                5,
              ],
              'circle-color': ['get', 'accent'],
              'circle-stroke-width': 1.5,
              'circle-stroke-color': props.darkMode ? '#111' : '#fff',
              'circle-opacity': 0.95,
            }}
          />
        </Source>

        {tooltip && (
          <Popup
            anchor="bottom"
            closeButton={tooltip.pinned}
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
              {tooltip.year != null && <div style={{ opacity: 0.7 }}>{tooltip.year}</div>}
              {tooltip.label && (
                <div style={{ marginTop: 4 }}>{tooltip.label}</div>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}

export default GeographicMap
