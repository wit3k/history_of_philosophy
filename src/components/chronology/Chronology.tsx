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
import LocationDetails from '../location/LocationDetails'
import PersonDetails from '../person/PersonDetails'
import PersonHistoryEventDetails from '../personHistoryEvents/PersonHistoryEventDetails'
import PublicationDetails from '../publication/PublicationDetails'
import Menu from '../ui/Menu'
import SearchBar from '../ui/SearchBar'

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
        clearMapCamera?: boolean
      } = {},
      mode: 'replace' | 'push' = 'replace',
    ) => {
      const nextView = next.view ?? view
      const collection = next.collection ?? activeCollectionIdRef.current
      const layers = next.layers ?? currentLayers()
      const dark = next.dark ?? darkMode

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
      persistUrl({ collection: collectionId, clearMapCamera: true, view: 'map' }, 'push')
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
        }
        return
      }

      if (parsed.view === 'timeline' && hasRange) {
        timelineViewportRef.current = { start: rangeStart, end: rangeEnd, row }
        frameViewportToRange(rangeStart, rangeEnd, row)
      }
    },
    [frameViewportToPeople, frameViewportToRange],
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
      writeAppUrl({
        view: 'map',
        collection: activeCollectionIdRef.current,
        layers: currentLayers(),
        dark: darkMode,
        lat: next.lat,
        lng: next.lng,
        zoom: next.zoom,
      })
    },
    [currentLayers, darkMode],
  )

  const toggleMapView = () => {
    const nextView: AppView = view === 'map' ? 'timeline' : 'map'
    setView(nextView)
    if (nextView === 'map') {
      // Keep existing map camera if we had one; otherwise fit bounds.
      persistUrl({ view: 'map', clearMapCamera: mapCamera == null }, 'push')
    } else {
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
          peopleHistoryEvents={peopleHistoryEvents}
          peopleList={peopleList}
          publicationsList={publicationsList}
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
