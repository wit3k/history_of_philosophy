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
  cameraYFromTopRow,
  parseViewHash,
  topRowFromCameraY,
  visibleYearRange,
  writeViewHash,
} from '../../utils/viewHash'
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

const Chronology = () => {
  const [dimenstions, setWindowDimensions] = React.useState(getWindowDimensions())

  React.useEffect(() => {
    if (hasWindow) {
      function handleResize() {
        setWindowDimensions(getWindowDimensions())
      }

      window.addEventListener('resize', handleResize)
      window.addEventListener('orientationchange', handleResize)
      return () => window.removeEventListener('resize', handleResize)
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
  const [collectionsState, setCollectionsState] = React.useState<Collection[]>(CollectionsListService.getAll())
  const activeCollectionIdRef = React.useRef(
    CollectionsListService.getAll().find(c => c.isActive)?.id ?? ALL_COLLECTIONS_ID,
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

  const [displayAuthors, setDisplayAuthors] = React.useState(true)
  const [displayAuthorsTimeline, setDisplayAuthorsTimeline] = React.useState(true)
  const [displayAuthorRelations, setDisplayAuthorRelations] = React.useState(true)
  const [displayPublications, setDisplayPublications] = React.useState(true)
  const [displayPublicationRelations, setDisplayPublicationRelations] = React.useState(true)
  const [displayHistoryEvents, setDisplayHistoryEvents] = React.useState(true)
  const [displayPersonHistoryEvents, setDisplayPersonHistoryEvents] = React.useState(true)
  const [darkMode, setDarkMode] = React.useState(window?.matchMedia('(prefers-color-scheme: dark)').matches)

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

    // World history events with no collection stay visible for every selection.
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

  const frameViewportToRange = React.useCallback((from: number, to: number, row = 0) => {
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
  }, [prop.rowHeight])

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
    if (visiblePeople.length > 0) {
      const start = Math.min(...visiblePeople.map(person => person.born))
      const end = Math.max(...visiblePeople.map(person => person.died))
      frameViewportToRange(start, end, 0)
      writeViewHash({ collection: collectionId, start, end, row: 0 })
      return
    }
    const width = currentWindowWidth()
    if (width > 0) {
      const { start, end } = visibleYearRange(viewPosition.x, zoom, width)
      const row = topRowFromCameraY(viewPosition.y, prop.rowHeight)
      writeViewHash({ collection: collectionId, start, end, row })
    }
  }

  const applyViewFromHash = React.useCallback(
    (hash: string) => {
      const parsed = parseViewHash(hash)
      const rangeStart = parsed.start
      const rangeEnd = parsed.end
      const row = parsed.row ?? 0
      const hasRange = rangeStart != null && rangeEnd != null && rangeEnd > rangeStart

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
        if (hasRange) {
          frameViewportToRange(rangeStart, rangeEnd, row)
        } else {
          frameViewportToPeople(visiblePeople, row)
        }
        return
      }

      if (hasRange) {
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
      writeViewHash({ collection: activeCollectionIdRef.current, start, end, row })
    },
    [dimenstions.x, prop.rowHeight],
  )

  React.useEffect(() => {
    applyViewFromHash(window.location.hash)
    const onHashChange = () => applyViewFromHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [applyViewFromHash])

  React.useEffect(() => {
    document.documentElement.classList.toggle('light-mode', !darkMode)
  }, [darkMode])

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
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const darkModeEventHandler = (event: MediaQueryListEvent) => {
      setDarkMode(event.matches)
    }
    darkModeMediaQuery.addEventListener('change', darkModeEventHandler)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      darkModeMediaQuery.removeEventListener('change', darkModeEventHandler)
    }
  }, [closeSearch, openSearch, searchOpen])

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
          onCloseSearch={closeSearch}
          onOpenSearch={openSearch}
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
