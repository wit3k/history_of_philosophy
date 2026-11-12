import React from 'react'
import CollectionsListService, {
  ALL_COLLECTIONS_ID,
  UNASSIGNED_COLLECTION_ID,
} from '../../data/db/CollectionsListService'
import HistoryEventsListService from '../../data/db/HistoryEventsListService'
import LocationListService from '../../data/db/LocationListService'
import PeopleHistoryEventsListService from '../../data/db/PeopleHistoryEventsListService'
import PeopleListService from '../../data/db/PeopleListService'
import PersonReferenceListService from '../../data/db/PersonReferenceListService'
import PublicationReferenceListService from '../../data/db/PublicationReferenceListService'
import PublicationsListService from '../../data/db/PublicationsListService'
import type Collection from '../../data/dto/Collection'
import type HistoryEvent from '../../data/dto/HistoryEvent'
import Location from '../../data/dto/Location'
import Person from '../../data/dto/Person'
import PersonHistoryEvent from '../../data/dto/PersonHistoryEvent'
import type PersonReference from '../../data/dto/PersonReference'
import Publication from '../../data/dto/Publication'
import type PublicationReference from '../../data/dto/PublicationReference'
import Coordinates from '../../geometry/Coordinates'
import TimelineDiagram from '../../pixi/TimelineDiagram'
import {
  type AppView,
  type LayerFlags,
  cameraYFromTopRow,
  formatAppUrl,
  readAppUrl,
  subscribeAppUrl,
  topRowFromCameraY,
  visibleYearRange,
  writeAppUrl,
} from '../../utils/appUrl'
import GeographicMap from '../map/GeographicMap'
import MapTemporalScrubber from '../map/MapTemporalScrubber'
import LocationDetails from '../location/LocationDetails'
import PersonDetails from '../person/PersonDetails'
import PersonHistoryEventDetails from '../personHistoryEvents/PersonHistoryEventDetails'
import PublicationDetails from '../publication/PublicationDetails'
import Menu from '../ui/Menu'
import SearchBar from '../ui/SearchBar'
import { buildPersonLifePaths } from '../../utils/lifePaths'
import {
  buildAvatarTracks,
  clampYearToRange,
  collectionLifespanSpan,
  contentYearsFromPaths,
  playbackYearsPerSecond,
  type PlaybackSpeed,
  type TemporalMode,
} from '../../utils/mapTemporal'
import { quantizeToDay } from '../../utils/years'

class ChronologyProperies {
  constructor(
    public windowSize: Coordinates,
    public yearLabelWidth: number,
    public rowHeight: number,
  ) {}
}
const hasWindow = typeof window !== 'undefined'

const getWindowDimensions = () => ({
  x: hasWindow ? window.innerWidth : 0,
  y: hasWindow ? window.innerHeight : 0,
})

const initialUrl = hasWindow ? readAppUrl() : null

const Chronology = () => {
  const [dimenstions, setWindowDimensions] = React.useState(getWindowDimensions())

  React.useEffect(() => {
    if (hasWindow) {
      function handleResize() {
        setWindowDimensions(getWindowDimensions())
      }

      window.addEventListener('resize', handleResize)
      window.addEventListener('orientationchange', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('orientationchange', handleResize)
      }
    }
  }, [])

  const prop: ChronologyProperies = {
    rowHeight: 45,
    windowSize: dimenstions,
    yearLabelWidth: 100,
  }

  const [peopleList, setPeopleList] = React.useState<Person[]>(
    PeopleListService.withRowNumbers(PeopleListService.getAll()),
  )
  const [locationsList, setLocationsList] = React.useState<Location[]>(LocationListService.getAll())
  const [historyEvents, setHistoryEvents] = React.useState<HistoryEvent[]>(HistoryEventsListService.getAll())
  const [peopleReferenceList, setPeopleReferenceList] = React.useState<PersonReference[]>(
    PersonReferenceListService.getAll(),
  )
  const [publicationsList, setPublicationsList] = React.useState<Publication[]>(PublicationsListService.getAll())
  const [publicationReferenceList, setPublicationReferenceList] = React.useState<PublicationReference[]>(
    PublicationReferenceListService.getAll(),
  )
  const [peopleHistoryEvents, setPeopleHistoryEvents] = React.useState<PersonHistoryEvent[]>(
    PeopleHistoryEventsListService.getAll(),
  )
  const [collectionsState, setCollectionsState] = React.useState<Collection[]>(() => {
    const all = CollectionsListService.getAll()
    const fromUrl = initialUrl?.collection
    if (fromUrl && all.some(c => c.id === fromUrl)) {
      return all.map(c => ({ ...c, isActive: c.id === fromUrl }))
    }
    return all
  })
  const activeCollectionIdRef = React.useRef(
    collectionsState.find(c => c.isActive)?.id ?? ALL_COLLECTIONS_ID,
  )
  const viewportFrameId = React.useRef(0)
  const [viewportFrame, setViewportFrame] = React.useState<{
    id: number
    x: number
    y: number
    zoom: number
  } | null>(null)
  const [zoom, setZoom] = React.useState(10)
  const [viewPosition, setPosition] = React.useState({ x: 1588, y: 0 })
  const [yearSelection, setYearSelection] = React.useState({
    from: -3000,
    stepSize: 100,
    to: 3000,
  })

  const [displayPublicationModal, setDisplayPublicationModal] = React.useState<boolean>(false)
  const [displayLocationModal, setDisplayLocationModal] = React.useState<boolean>(false)
  const [displayPersonModal, setDisplayPersonModal] = React.useState<boolean>(false)
  const [displayPersonHistoryEventModal, setDisplayPersonHistoryEventModal] = React.useState<boolean>(false)
  const [currentLocation, setCurrentLocation] = React.useState(new Location('', '', new Coordinates(0, 0), ''))

  const [displayAuthors, setDisplayAuthors] = React.useState(initialUrl?.layers.authors ?? true)
  const [displayAuthorsTimeline, setDisplayAuthorsTimeline] = React.useState(initialUrl?.layers.lifelines ?? true)
  const [displayAuthorRelations, setDisplayAuthorRelations] = React.useState(initialUrl?.layers.sympathies ?? true)
  const [displayPublications, setDisplayPublications] = React.useState(initialUrl?.layers.pubs ?? true)
  const [displayPublicationRelations, setDisplayPublicationRelations] = React.useState(
    initialUrl?.layers.refs ?? true,
  )
  const [displayHistoryEvents, setDisplayHistoryEvents] = React.useState(initialUrl?.layers.events ?? true)
  const [displayPersonHistoryEvents, setDisplayPersonHistoryEvents] = React.useState(
    initialUrl?.layers.personal ?? true,
  )
  const [darkMode, setDarkMode] = React.useState(() => {
    if (initialUrl?.dark !== undefined) return initialUrl.dark
    return hasWindow ? window.matchMedia('(prefers-color-scheme: dark)').matches : true
  })

  const [view, setView] = React.useState<AppView>(initialUrl?.view ?? 'timeline')
  const [mapCamera, setMapCamera] = React.useState<{ lat: number; lng: number; zoom: number } | null>(() => {
    if (
      initialUrl?.lat != null &&
      initialUrl?.lng != null &&
      initialUrl?.zoom != null
    ) {
      return { lat: initialUrl.lat, lng: initialUrl.lng, zoom: initialUrl.zoom }
    }
    return null
  })
  const mapCameraFromUrl = React.useRef(mapCamera != null)

  const initialPeople = PeopleListService.withRowNumbers(PeopleListService.getAll())
  const initialSpan = collectionLifespanSpan(initialPeople) ?? { yearFrom: -500, yearTo: 2000 }
  const [mapYearFrom, setMapYearFrom] = React.useState(() =>
    initialUrl?.yearFrom != null ? Math.round(initialUrl.yearFrom) : initialSpan.yearFrom,
  )
  const [mapYearTo, setMapYearTo] = React.useState(() =>
    initialUrl?.yearTo != null ? Math.round(initialUrl.yearTo) : initialSpan.yearTo,
  )
  const [mapYear, setMapYear] = React.useState(() => {
    const from = initialUrl?.yearFrom != null ? Math.round(initialUrl.yearFrom) : initialSpan.yearFrom
    const to = initialUrl?.yearTo != null ? Math.round(initialUrl.yearTo) : initialSpan.yearTo
    const y = initialUrl?.year != null ? Math.round(initialUrl.year) : from
    return clampYearToRange(y, from, to)
  })
  const [temporalMode, setTemporalMode] = React.useState<TemporalMode>(() =>
    initialUrl?.year != null && initialUrl.year !== (initialUrl.yearFrom ?? initialSpan.yearFrom)
      ? 'playhead'
      : 'range',
  )
  const [mapPlaying, setMapPlaying] = React.useState(false)
  const [playbackSpeed, setPlaybackSpeed] = React.useState<PlaybackSpeed>(1)
  const [filtersVisible, setFiltersVisible] = React.useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true,
  )
  const playbackSpeedRef = React.useRef<PlaybackSpeed>(1)
  playbackSpeedRef.current = playbackSpeed
  const mapTemporalRef = React.useRef({ year: mapYear, yearFrom: mapYearFrom, yearTo: mapYearTo })
  // While playing, the rAF loop owns `year` (including sub-year fractions). Syncing from
  // React state every render would snap it back and kill day-level smoothness.
  mapTemporalRef.current = {
    year: mapPlaying ? mapTemporalRef.current.year : mapYear,
    yearFrom: mapYearFrom,
    yearTo: mapYearTo,
  }
  const playRafRef = React.useRef<number | null>(null)
  /** Limit React map commits while playing — ref still advances every frame. */
  const lastPlayCommitMsRef = React.useRef(0)
  const lastPlayCommitYearRef = React.useRef<number | null>(null)
  const lastUrlWriteRef = React.useRef(0)

  const timelineViewportRef = React.useRef<{ start?: number; end?: number; row?: number }>({
    start: initialUrl?.start,
    end: initialUrl?.end,
    row: initialUrl?.row,
  })

  const [highlightedAuthor, updateHighlightedAuthor] = React.useState('0')
  const [currentPublication, setCurrentPublication] = React.useState<Publication>(new Publication('', '', 0, 0, '', ''))
  const [currentAuthor, setCurrentAuthor] = React.useState(new Person('', '', 0, 0, true, '', '', '', 1, '', ''))
  const [currentPersonHistoryEvent, setCurrentPersonHistoryEvent] = React.useState<PersonHistoryEvent>(
    new PersonHistoryEvent('', '', '', '', null, null, null),
  )
  const [highlightedPublication, updateHighlightedPublication] = React.useState('0')
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  const openSearch = React.useCallback(() => {
    setSearchOpen(true)
  }, [])
  const closeSearch = React.useCallback(() => {
    setSearchOpen(false)
    setSearchQuery('')
  }, [])

  const currentLayers = React.useCallback(
    (): LayerFlags => ({
      authors: displayAuthors,
      lifelines: displayAuthorsTimeline,
      sympathies: displayAuthorRelations,
      pubs: displayPublications,
      refs: displayPublicationRelations,
      events: displayHistoryEvents,
      personal: displayPersonHistoryEvents,
    }),
    [
      displayAuthors,
      displayAuthorsTimeline,
      displayAuthorRelations,
      displayPublications,
      displayPublicationRelations,
      displayHistoryEvents,
      displayPersonHistoryEvents,
    ],
  )

  const persistUrl = React.useCallback(
    (
      next: {
        view?: AppView
        collection?: string
        layers?: LayerFlags
        dark?: boolean
        start?: number
        end?: number
        row?: number
        lat?: number
        lng?: number
        zoom?: number
        year?: number
        yearFrom?: number
        yearTo?: number
        clearMapCamera?: boolean
      } = {},
      mode: 'replace' | 'push' = 'replace',
    ) => {
      const nextView = next.view ?? view
      const collection = next.collection ?? activeCollectionIdRef.current
      const layers = next.layers ?? currentLayers()
      const dark = next.dark ?? darkMode
      const temporal = mapTemporalRef.current

      if (nextView === 'timeline') {
        const start = next.start ?? timelineViewportRef.current.start
        const end = next.end ?? timelineViewportRef.current.end
        const row = next.row ?? timelineViewportRef.current.row
        writeAppUrl(
          {
            view: 'timeline',
            collection,
            layers,
            dark,
            start,
            end,
            row,
          },
          mode,
        )
      } else {
        const useCamera = next.clearMapCamera
          ? null
          : next.lat != null && next.lng != null && next.zoom != null
            ? { lat: next.lat, lng: next.lng, zoom: next.zoom }
            : mapCamera
        writeAppUrl(
          {
            view: 'map',
            collection,
            layers,
            dark,
            lat: useCamera?.lat,
            lng: useCamera?.lng,
            zoom: useCamera?.zoom,
            yearFrom: next.yearFrom ?? temporal.yearFrom,
            yearTo: next.yearTo ?? temporal.yearTo,
            year: next.year ?? temporal.year,
          },
          mode,
        )
      }
    },
    [currentLayers, darkMode, mapCamera, view],
  )

  interface HasId {
    id: string
  }

  const applyCollectionFilter = (selectedId: string, collections: Collection[]) => {
    const selected = collections.find(c => c.id === selectedId)

    function itemsFilter<S extends HasId>(cmap: (collection: Collection) => number[]) {
      if (selectedId === ALL_COLLECTIONS_ID || !selected) {
        return (_item: S, __: number) => true
      }

      const realCollections = collections.filter(c => c.id !== ALL_COLLECTIONS_ID && c.id !== UNASSIGNED_COLLECTION_ID)
      const allCollectionIds = realCollections.flatMap(cmap).map(c => `${c}`)

      if (selectedId === UNASSIGNED_COLLECTION_ID) {
        return (item: S, _: number) => !allCollectionIds.includes(item.id)
      }

      const includedIds = cmap(selected).map(c => `${c}`)
      return (item: S, _: number) => includedIds.includes(item.id)
    }

    const filteredPeople = PeopleListService.getAll().filter(itemsFilter(c => c.includedPeople))
    setPeopleList(PeopleListService.withRowNumbers(filteredPeople))
    setLocationsList(LocationListService.getAll().filter(itemsFilter(c => c.includedLocations)))

    const realCollections = collections.filter(c => c.id !== ALL_COLLECTIONS_ID && c.id !== UNASSIGNED_COLLECTION_ID)
    const eventsInAnyCollection = new Set(realCollections.flatMap(c => c.includedEvents).map(id => `${id}`))
    const eventInSelected = itemsFilter(c => c.includedEvents)
    setHistoryEvents(
      HistoryEventsListService.getAll().filter(
        (event, i) => eventInSelected(event, i) || !eventsInAnyCollection.has(event.id),
      ),
    )

    setPublicationsList(PublicationsListService.getAll().filter(itemsFilter(c => c.includedPublications)))
    setPublicationReferenceList(PublicationReferenceListService.getAll().filter(itemsFilter(c => c.includedReferences)))
    setPeopleReferenceList(PersonReferenceListService.getAll().filter(itemsFilter(c => c.includedPeopleRelations)))
    const visiblePersonIds = new Set(filteredPeople.map(p => p.id))
    setPeopleHistoryEvents(PeopleHistoryEventsListService.getAll().filter(e => visiblePersonIds.has(e.personId)))
    return filteredPeople
  }

  const currentWindowWidth = () => dimenstions.x || (hasWindow ? window.innerWidth : 0)

  const frameViewportToRange = React.useCallback(
    (from: number, to: number, row = 0) => {
      const width = hasWindow ? window.innerWidth : 0
      if (width <= 0) return
      const span = Math.max(to - from, 1)
      viewportFrameId.current += 1
      setViewportFrame({
        id: viewportFrameId.current,
        x: from,
        y: cameraYFromTopRow(row, prop.rowHeight),
        zoom: width / span,
      })
    },
    [prop.rowHeight],
  )

  const frameViewportToPeople = React.useCallback(
    (people: Person[], row = 0) => {
      if (people.length === 0) return
      const born = Math.min(...people.map(person => person.born))
      const died = Math.max(...people.map(person => person.died))
      frameViewportToRange(born, died, row)
    },
    [frameViewportToRange],
  )

  const selectCollection = (collectionId: string) => {
    const newCollectionsState = collectionsState.map((c: Collection) => ({
      ...c,
      isActive: c.id === collectionId,
    }))
    activeCollectionIdRef.current = collectionId
    setCollectionsState(newCollectionsState)
    const visiblePeople = applyCollectionFilter(collectionId, newCollectionsState)
    if (view === 'map') {
      mapCameraFromUrl.current = false
      setMapCamera(null)
      const span = collectionLifespanSpan(visiblePeople)
      if (span) {
        setMapYearFrom(span.yearFrom)
        setMapYearTo(span.yearTo)
        setMapYear(span.yearFrom)
        setTemporalMode('range')
        setMapPlaying(false)
        mapTemporalRef.current = { year: span.yearFrom, yearFrom: span.yearFrom, yearTo: span.yearTo }
        persistUrl(
          {
            collection: collectionId,
            clearMapCamera: true,
            view: 'map',
            year: span.yearFrom,
            yearFrom: span.yearFrom,
            yearTo: span.yearTo,
          },
          'push',
        )
      } else {
        persistUrl({ collection: collectionId, clearMapCamera: true, view: 'map' }, 'push')
      }
      return
    }
    if (visiblePeople.length > 0) {
      const start = Math.min(...visiblePeople.map(person => person.born))
      const end = Math.max(...visiblePeople.map(person => person.died))
      frameViewportToRange(start, end, 0)
      timelineViewportRef.current = { start, end, row: 0 }
      persistUrl({ collection: collectionId, start, end, row: 0 }, 'push')
      return
    }
    const width = currentWindowWidth()
    if (width > 0) {
      const { start, end } = visibleYearRange(viewPosition.x, zoom, width)
      const row = topRowFromCameraY(viewPosition.y, prop.rowHeight)
      timelineViewportRef.current = { start, end, row }
      persistUrl({ collection: collectionId, start, end, row }, 'push')
    }
  }

  const applyUrlState = React.useCallback(
    (parsed: ReturnType<typeof readAppUrl>) => {
      setView(parsed.view)
      setDisplayAuthors(parsed.layers.authors)
      setDisplayAuthorsTimeline(parsed.layers.lifelines)
      setDisplayAuthorRelations(parsed.layers.sympathies)
      setDisplayPublications(parsed.layers.pubs)
      setDisplayPublicationRelations(parsed.layers.refs)
      setDisplayHistoryEvents(parsed.layers.events)
      setDisplayPersonHistoryEvents(parsed.layers.personal)
      if (parsed.dark !== undefined) setDarkMode(parsed.dark)

      const rangeStart = parsed.start
      const rangeEnd = parsed.end
      const row = parsed.row ?? 0
      const hasRange = rangeStart != null && rangeEnd != null && rangeEnd > rangeStart

      if (parsed.lat != null && parsed.lng != null && parsed.zoom != null) {
        mapCameraFromUrl.current = true
        setMapCamera({ lat: parsed.lat, lng: parsed.lng, zoom: parsed.zoom })
      } else if (parsed.view === 'map') {
        mapCameraFromUrl.current = false
        setMapCamera(null)
      }

      const applyMapTemporal = (people: Person[]) => {
        if (parsed.view !== 'map') return
        const span = collectionLifespanSpan(people)
        const yearFrom =
          parsed.yearFrom != null ? Math.round(parsed.yearFrom) : (span?.yearFrom ?? mapTemporalRef.current.yearFrom)
        const yearTo =
          parsed.yearTo != null ? Math.round(parsed.yearTo) : (span?.yearTo ?? mapTemporalRef.current.yearTo)
        const year =
          parsed.year != null
            ? clampYearToRange(Math.round(parsed.year), yearFrom, yearTo)
            : yearFrom
        setMapYearFrom(yearFrom)
        setMapYearTo(yearTo)
        setMapYear(year)
        setTemporalMode(parsed.year != null && parsed.year !== yearFrom ? 'playhead' : 'range')
        mapTemporalRef.current = { year, yearFrom, yearTo }
      }

      if (parsed.collection) {
        const known = CollectionsListService.getAll().some(c => c.id === parsed.collection)
        if (!known) return
        const newCollectionsState = CollectionsListService.getAll().map(c => ({
          ...c,
          isActive: c.id === parsed.collection,
        }))
        activeCollectionIdRef.current = parsed.collection
        setCollectionsState(newCollectionsState)
        const visiblePeople = applyCollectionFilter(parsed.collection, newCollectionsState)
        if (parsed.view === 'timeline') {
          if (hasRange) {
            timelineViewportRef.current = { start: rangeStart, end: rangeEnd, row }
            frameViewportToRange(rangeStart, rangeEnd, row)
          } else {
            frameViewportToPeople(visiblePeople, row)
          }
        } else {
          applyMapTemporal(visiblePeople)
        }
        return
      }

      if (parsed.view === 'timeline' && hasRange) {
        timelineViewportRef.current = { start: rangeStart, end: rangeEnd, row }
        frameViewportToRange(rangeStart, rangeEnd, row)
      } else if (parsed.view === 'map') {
        applyMapTemporal(peopleList)
      }
    },
    [frameViewportToPeople, frameViewportToRange, peopleList],
  )

  const onCameraCommit = React.useCallback(
    (camera: { x: number; y: number; zoom: number }) => {
      const width = currentWindowWidth()
      if (width <= 0) return
      const { start, end } = visibleYearRange(camera.x, camera.zoom, width)
      const row = topRowFromCameraY(camera.y, prop.rowHeight)
      timelineViewportRef.current = { start, end, row }
      writeAppUrl({
        view: 'timeline',
        collection: activeCollectionIdRef.current,
        layers: currentLayers(),
        dark: darkMode,
        start,
        end,
        row,
      })
    },
    [currentLayers, darkMode, dimenstions.x, prop.rowHeight],
  )

  const onMapCameraCommit = React.useCallback(
    (camera: { latitude: number; longitude: number; zoom: number }) => {
      const next = { lat: camera.latitude, lng: camera.longitude, zoom: camera.zoom }
      setMapCamera(next)
      mapCameraFromUrl.current = true
      const temporal = mapTemporalRef.current
      writeAppUrl({
        view: 'map',
        collection: activeCollectionIdRef.current,
        layers: currentLayers(),
        dark: darkMode,
        lat: next.lat,
        lng: next.lng,
        zoom: next.zoom,
        year: temporal.year,
        yearFrom: temporal.yearFrom,
        yearTo: temporal.yearTo,
      })
    },
    [currentLayers, darkMode],
  )

  const persistMapTemporalThrottled = React.useCallback(
    (year: number, yearFrom: number, yearTo: number, force = false) => {
      const now = performance.now()
      if (!force && now - lastUrlWriteRef.current < 200) return
      lastUrlWriteRef.current = now
      persistUrl({ view: 'map', year, yearFrom, yearTo }, 'replace')
    },
    [persistUrl],
  )

  const onScrubberRangeChange = React.useCallback(
    (yearFrom: number, yearTo: number) => {
      const year = clampYearToRange(mapTemporalRef.current.year, yearFrom, yearTo)
      setMapYearFrom(yearFrom)
      setMapYearTo(yearTo)
      setMapYear(year)
      setTemporalMode('range')
      setMapPlaying(false)
      mapTemporalRef.current = { year, yearFrom, yearTo }
      persistMapTemporalThrottled(year, yearFrom, yearTo)
    },
    [persistMapTemporalThrottled],
  )

  const onScrubberYearChange = React.useCallback(
    (year: number) => {
      const { yearFrom, yearTo } = mapTemporalRef.current
      const next = clampYearToRange(year, yearFrom, yearTo)
      setMapYear(next)
      setTemporalMode('playhead')
      setMapPlaying(false)
      mapTemporalRef.current = { ...mapTemporalRef.current, year: next }
      persistMapTemporalThrottled(next, yearFrom, yearTo)
    },
    [persistMapTemporalThrottled],
  )

  const stopPlayback = React.useCallback(() => {
    setMapPlaying(false)
    if (playRafRef.current != null) {
      cancelAnimationFrame(playRafRef.current)
      playRafRef.current = null
    }
  }, [])

  const onScrubberSeek = React.useCallback(
    (year: number) => {
      const span = collectionLifespanSpan(peopleList)
      const axisLo = span?.yearFrom ?? mapTemporalRef.current.yearFrom
      const axisHi = span?.yearTo ?? mapTemporalRef.current.yearTo
      const lo = Math.min(axisLo, axisHi)
      const hi = Math.max(axisLo, axisHi)
      const next = clampYearToRange(Math.round(year), lo, hi)
      let { yearFrom, yearTo } = mapTemporalRef.current
      if (next < yearFrom) yearFrom = next
      if (next > yearTo) yearTo = next
      setMapYearFrom(yearFrom)
      setMapYearTo(yearTo)
      setMapYear(next)
      setTemporalMode('playhead')
      mapTemporalRef.current = { year: next, yearFrom, yearTo }
      persistMapTemporalThrottled(next, yearFrom, yearTo, true)
    },
    [peopleList, persistMapTemporalThrottled],
  )

  const onPlayToggle = React.useCallback(() => {
    if (mapPlaying) {
      stopPlayback()
      const t = mapTemporalRef.current
      persistUrl({ view: 'map', year: t.year, yearFrom: t.yearFrom, yearTo: t.yearTo }, 'replace')
      return
    }
    const { year, yearFrom, yearTo } = mapTemporalRef.current
    const start = year >= yearTo ? yearFrom : year
    setMapYear(start)
    setTemporalMode('playhead')
    mapTemporalRef.current = { ...mapTemporalRef.current, year: start }
    persistUrl({ view: 'map', year: start, yearFrom, yearTo }, 'replace')
    setMapPlaying(true)
  }, [mapPlaying, persistUrl, stopPlayback])

  React.useEffect(() => {
    if (!mapPlaying || view !== 'map') return

    const paths = buildPersonLifePaths(
      peopleList,
      LocationListService.getAll(),
      peopleHistoryEvents,
      publicationsList,
    )
    const tracks = buildAvatarTracks(peopleList, LocationListService.getAll(), peopleHistoryEvents)
    const contentYears = contentYearsFromPaths(paths, tracks, {
      showAuthors: displayAuthors,
      showPublications: displayPublications,
      showPersonal: displayPersonHistoryEvents,
    })

    let lastTs: number | null = null
    lastPlayCommitMsRef.current = 0
    lastPlayCommitYearRef.current = Math.round(mapTemporalRef.current.year)
    const tick = (ts: number) => {
      if (lastTs == null) lastTs = ts
      const dt = Math.min((ts - lastTs) / 1000, 0.1)
      lastTs = ts
      const current = mapTemporalRef.current
      if (current.year >= current.yearTo) {
        setMapYear(current.yearTo)
        mapTemporalRef.current = { ...current, year: current.yearTo }
        lastPlayCommitYearRef.current = Math.round(current.yearTo)
        persistUrl(
          { view: 'map', year: current.yearTo, yearFrom: current.yearFrom, yearTo: current.yearTo },
          'replace',
        )
        stopPlayback()
        return
      }
      const speedMult = playbackSpeedRef.current
      const speed = playbackYearsPerSecond(
        current.year,
        current.yearTo,
        contentYears,
        speedMult,
      )
      const next = Math.min(current.yearTo, current.year + speed * dt)
      mapTemporalRef.current = { ...current, year: next }
      persistMapTemporalThrottled(next, current.yearFrom, current.yearTo)
      // Below 1×: commit day steps so portraits/paths animate smoothly.
      // At 1× and above: keep whole-year commits (throttled) to avoid dense rebuilds.
      const commitYear = speedMult < 1 ? quantizeToDay(next) : Math.round(next)
      const dayChanged = commitYear !== lastPlayCommitYearRef.current
      const due = speedMult < 1 ? dayChanged : dayChanged || ts - lastPlayCommitMsRef.current >= 180
      if (due) {
        lastPlayCommitMsRef.current = ts
        lastPlayCommitYearRef.current = commitYear
        setMapYear(commitYear)
      }
      playRafRef.current = requestAnimationFrame(tick)
    }
    playRafRef.current = requestAnimationFrame(tick)
    return () => {
      if (playRafRef.current != null) cancelAnimationFrame(playRafRef.current)
      playRafRef.current = null
    }
  }, [
    mapPlaying,
    view,
    peopleList,
    peopleHistoryEvents,
    publicationsList,
    displayAuthors,
    displayPublications,
    displayPersonHistoryEvents,
    persistMapTemporalThrottled,
    persistUrl,
    stopPlayback,
  ])

  const toggleMapView = () => {
    const nextView: AppView = view === 'map' ? 'timeline' : 'map'
    setView(nextView)
    if (nextView === 'map') {
      const span = collectionLifespanSpan(peopleList)
      if (span) {
        setMapYearFrom(span.yearFrom)
        setMapYearTo(span.yearTo)
        setMapYear(span.yearFrom)
        setTemporalMode('range')
        setMapPlaying(false)
        mapTemporalRef.current = { year: span.yearFrom, yearFrom: span.yearFrom, yearTo: span.yearTo }
        persistUrl(
          {
            view: 'map',
            clearMapCamera: mapCamera == null,
            year: span.yearFrom,
            yearFrom: span.yearFrom,
            yearTo: span.yearTo,
          },
          'push',
        )
      } else {
        persistUrl({ view: 'map', clearMapCamera: mapCamera == null }, 'push')
      }
    } else {
      stopPlayback()
      persistUrl({ view: 'timeline' }, 'push')
    }
  }

  // Initial URL apply (collection + timeline camera) once.
  const didInit = React.useRef(false)
  React.useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    const parsed = readAppUrl()
    applyUrlState(parsed)
    // Ensure address bar uses query (and clears hash) without fighting first paint.
    const href = formatAppUrl({
      view: parsed.view,
      collection: activeCollectionIdRef.current,
      layers: parsed.layers,
      dark: parsed.dark ?? darkMode,
      start: parsed.start,
      end: parsed.end,
      row: parsed.row,
      lat: parsed.lat,
      lng: parsed.lng,
      zoom: parsed.zoom,
      year: parsed.year ?? (parsed.view === 'map' ? mapTemporalRef.current.year : undefined),
      yearFrom: parsed.yearFrom ?? (parsed.view === 'map' ? mapTemporalRef.current.yearFrom : undefined),
      yearTo: parsed.yearTo ?? (parsed.view === 'map' ? mapTemporalRef.current.yearTo : undefined),
    })
    if (`${window.location.pathname}${window.location.search}` !== href || window.location.hash) {
      history.replaceState(null, '', href)
    }
  }, [applyUrlState, darkMode])

  React.useEffect(() => {
    return subscribeAppUrl(() => {
      applyUrlState(readAppUrl())
    })
  }, [applyUrlState])

  React.useEffect(() => {
    document.documentElement.classList.toggle('light-mode', !darkMode)
  }, [darkMode])

  // Persist layer / dark changes to URL (replace).
  const skipFirstLayerPersist = React.useRef(true)
  React.useEffect(() => {
    if (skipFirstLayerPersist.current) {
      skipFirstLayerPersist.current = false
      return
    }
    persistUrl({ layers: currentLayers(), dark: darkMode })
  }, [
    displayAuthors,
    displayAuthorsTimeline,
    displayAuthorRelations,
    displayPublications,
    displayPublicationRelations,
    displayHistoryEvents,
    displayPersonHistoryEvents,
    darkMode,
    currentLayers,
    persistUrl,
  ])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        openSearch()
        return
      }
      if (e.key === 'Escape') {
        if (searchOpen) {
          closeSearch()
          return
        }
        setDisplayPublicationModal(false)
        setDisplayLocationModal(false)
        setDisplayPersonModal(false)
        setDisplayPersonHistoryEventModal(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [closeSearch, openSearch, searchOpen])

  const mapInitialCamera =
    mapCameraFromUrl.current && mapCamera
      ? { latitude: mapCamera.lat, longitude: mapCamera.lng, zoom: mapCamera.zoom }
      : null

  return (
    <div
      style={{
        background: darkMode ? 'rgb(43, 44, 45)' : 'white',
        height: prop.windowSize.y,
        overflow: 'hidden',
        position: 'relative',
        width: prop.windowSize.x,
      }}
    >
      {view === 'map' ? (
        <GeographicMap
          darkMode={darkMode}
          displayAuthors={displayAuthors}
          displayAuthorsTimeline={displayAuthorsTimeline}
          displayPersonHistoryEvents={displayPersonHistoryEvents}
          displayPublications={displayPublications}
          initialCamera={mapInitialCamera}
          locationsList={LocationListService.getAll()}
          onCameraCommit={onMapCameraCommit}
          onPersonClick={id => {
            const person = peopleList.find(p => p.id === id)
            if (!person) return
            setCurrentAuthor(person)
            setDisplayLocationModal(false)
            setDisplayPublicationModal(false)
            setDisplayPersonHistoryEventModal(false)
            setDisplayPersonModal(true)
          }}
          onPublicationClick={(publicationId, personId) => {
            const publication =
              publicationsList.find(p => p.id === publicationId) ??
              publicationsList.find(p => String(p.id) === String(publicationId))
            const author = peopleList.find(p => p.id === personId)
            if (!publication || !author) return
            setCurrentAuthor(author)
            setCurrentPublication(publication)
            setDisplayPublicationModal(true)
            setDisplayPersonModal(false)
            setDisplayLocationModal(false)
            setDisplayPersonHistoryEventModal(false)
          }}
          peopleHistoryEvents={peopleHistoryEvents}
          peopleList={peopleList}
          publicationsList={publicationsList}
          searchQuery={searchQuery}
          temporal={{
            year: mapYear,
            yearFrom: mapYearFrom,
            yearTo: mapYearTo,
            mode: temporalMode,
          }}
          windowHeight={prop.windowSize.y}
          windowWidth={prop.windowSize.x}
        />
      ) : (
        <TimelineDiagram
          darkMode={darkMode}
          displayAuthorRelations={displayAuthorRelations}
          displayAuthors={displayAuthors}
          displayAuthorsTimeline={displayAuthorsTimeline}
          displayHistoryEvents={displayHistoryEvents}
          displayPersonHistoryEvents={displayPersonHistoryEvents}
          displayPublicationRelations={displayPublicationRelations}
          displayPublications={displayPublications}
          highlightedAuthor={highlightedAuthor}
          highlightedPublication={highlightedPublication}
          historyEvents={historyEvents}
          onAuthorClick={id => {
            setCurrentAuthor(_ => peopleList.find(p => p.id === id)!)
            setDisplayLocationModal(false)
            setDisplayPublicationModal(false)
            setDisplayPersonHistoryEventModal(false)
            setDisplayPersonModal(true)
          }}
          onPersonHistoryClick={(event, person) => {
            setCurrentAuthor(person)
            setCurrentPersonHistoryEvent(event)
            setDisplayPersonHistoryEventModal(true)
            setDisplayPersonModal(false)
            setDisplayLocationModal(false)
            setDisplayPublicationModal(false)
          }}
          onPublicationClick={(publication, author) => {
            setCurrentAuthor(author)
            setCurrentPublication(publication)
            setDisplayPublicationModal(true)
          }}
          onCameraCommit={onCameraCommit}
          peopleHistoryEvents={peopleHistoryEvents}
          peopleList={peopleList}
          peopleReferenceList={peopleReferenceList}
          publicationReferenceList={publicationReferenceList}
          publicationsList={publicationsList}
          rowHeight={prop.rowHeight}
          searchQuery={searchQuery}
          setPosition={setPosition}
          setYearSelection={setYearSelection}
          setZoom={setZoom}
          suspended={
            displayPublicationModal ||
            displayLocationModal ||
            displayPersonModal ||
            displayPersonHistoryEventModal
          }
          updateHighlightedAuthor={updateHighlightedAuthor}
          updateHighlightedPublication={updateHighlightedPublication}
          viewPosition={viewPosition}
          viewportFrame={viewportFrame}
          windowHeight={prop.windowSize.y}
          windowWidth={prop.windowSize.x}
          yearLabelWidth={prop.yearLabelWidth}
          yearSelection={yearSelection}
          zoom={zoom}
        />
      )}

      {view === 'map' && (
        <MapTemporalScrubber
          axisFrom={collectionLifespanSpan(peopleList)?.yearFrom ?? mapYearFrom}
          axisTo={collectionLifespanSpan(peopleList)?.yearTo ?? mapYearTo}
          darkMode={darkMode}
          filtersVisible={filtersVisible}
          onPlayToggle={onPlayToggle}
          onRangeChange={onScrubberRangeChange}
          onSeek={onScrubberSeek}
          onSpeedChange={setPlaybackSpeed}
          onYearChange={onScrubberYearChange}
          playbackSpeed={playbackSpeed}
          playing={mapPlaying}
          year={mapYear}
          yearFrom={mapYearFrom}
          yearTo={mapYearTo}
        />
      )}

      <div style={{ position: 'relative', zIndex: 50 }}>
        <Menu
          collectionsState={collectionsState}
          darkMode={darkMode}
          displayAuthorRelations={displayAuthorRelations}
          displayAuthors={displayAuthors}
          displayAuthorsTimeline={displayAuthorsTimeline}
          displayHistoryEvents={displayHistoryEvents}
          displayPersonHistoryEvents={displayPersonHistoryEvents}
          displayPublicationRelations={displayPublicationRelations}
          displayPublications={displayPublications}
          mapView={view === 'map'}
          onCloseSearch={closeSearch}
          onFiltersVisibleChange={setFiltersVisible}
          onOpenSearch={openSearch}
          onToggleMapView={toggleMapView}
          searchOpen={searchOpen}
          selectCollection={selectCollection}
          setDarkMode={setDarkMode}
          setDisplayAuthorRelations={setDisplayAuthorRelations}
          setDisplayAuthors={setDisplayAuthors}
          setDisplayAuthorsTimeline={setDisplayAuthorsTimeline}
          setDisplayHistoryEvents={setDisplayHistoryEvents}
          setDisplayPersonHistoryEvents={setDisplayPersonHistoryEvents}
          setDisplayPublicationRelations={setDisplayPublicationRelations}
          setDisplayPublications={setDisplayPublications}
        />
      </div>

      <SearchBar
        darkMode={darkMode}
        onClose={closeSearch}
        onQueryChange={setSearchQuery}
        open={searchOpen}
        query={searchQuery}
      />

      <PublicationDetails
        authorCallback={id => {
          setCurrentAuthor(peopleList.find(p => p.id === id)!)
          setDisplayLocationModal(false)
          setDisplayPublicationModal(false)
          setDisplayPersonHistoryEventModal(false)
          setDisplayPersonModal(true)
        }}
        currentAuthor={currentAuthor}
        currentPublication={currentPublication}
        darkMode={darkMode}
        displayModal={displayPublicationModal}
        locationCallback={id => {
          setCurrentLocation(LocationListService.getById(id)!)
          setDisplayLocationModal(true)
          setDisplayPublicationModal(false)
          setDisplayPersonHistoryEventModal(false)
          setDisplayPersonModal(false)
        }}
        locationsList={locationsList}
        setDisplayModal={setDisplayPublicationModal}
      />

      <PersonHistoryEventDetails
        currentEvent={currentPersonHistoryEvent}
        currentPerson={currentAuthor}
        darkMode={darkMode}
        displayModal={displayPersonHistoryEventModal}
        locationCallback={id => {
          setCurrentLocation(LocationListService.getById(id)!)
          setDisplayLocationModal(true)
          setDisplayPublicationModal(false)
          setDisplayPersonHistoryEventModal(false)
          setDisplayPersonModal(false)
        }}
        personCallback={id => {
          const person = peopleList.find(p => p.id === id) ?? PeopleListService.getAll().find(p => p.id === id)
          if (!person) return
          setCurrentAuthor(person)
          setDisplayPersonModal(true)
          setDisplayLocationModal(false)
          setDisplayPublicationModal(false)
          setDisplayPersonHistoryEventModal(false)
        }}
        setDisplayModal={setDisplayPersonHistoryEventModal}
      />

      <LocationDetails
        authorCallback={id => {
          const person = peopleList.find(p => p.id === id) ?? PeopleListService.getAll().find(p => p.id === id)
          if (!person) return
          setCurrentAuthor(person)
          setDisplayPersonModal(true)
          setDisplayLocationModal(false)
          setDisplayPublicationModal(false)
          setDisplayPersonHistoryEventModal(false)
        }}
        currentLocation={currentLocation}
        darkMode={darkMode}
        displayModal={displayLocationModal}
        peopleList={peopleList}
        publicationCallback={id => {
          const publication =
            publicationsList.find(p => p.id === id) ?? PublicationsListService.getAll().find(p => p.id === id)
          if (!publication) return
          setCurrentPublication(publication)
          setDisplayPublicationModal(true)
          setDisplayLocationModal(false)
          setDisplayPersonModal(false)
          setDisplayPersonHistoryEventModal(false)
        }}
        setDisplayModal={setDisplayLocationModal}
      />

      <PersonDetails
        currentPerson={currentAuthor}
        darkMode={darkMode}
        displayModal={displayPersonModal}
        locationCallback={id => {
          const location = locationsList.find(l => l.id === id) ?? LocationListService.getById(id)
          if (!location) return
          setCurrentLocation(location)
          setDisplayLocationModal(true)
          setDisplayPersonModal(false)
          setDisplayPublicationModal(false)
          setDisplayPersonHistoryEventModal(false)
        }}
        personHistoryEventCallback={id => {
          const event =
            peopleHistoryEvents.find(e => e.id === id) ?? PeopleHistoryEventsListService.getAll().find(e => e.id === id)
          if (!event) return
          setCurrentPersonHistoryEvent(event)
          setDisplayPersonHistoryEventModal(true)
          setDisplayPersonModal(false)
          setDisplayLocationModal(false)
          setDisplayPublicationModal(false)
        }}
        publicationCallback={id => {
          const publication =
            publicationsList.find(p => p.id === id) ?? PublicationsListService.getAll().find(p => p.id === id)
          if (!publication) return
          setCurrentPublication(publication)
          setDisplayPublicationModal(true)
          setDisplayPersonModal(false)
          setDisplayLocationModal(false)
          setDisplayPersonHistoryEventModal(false)
        }}
        setDisplayModal={setDisplayPersonModal}
      />
    </div>
  )
}

export default Chronology
