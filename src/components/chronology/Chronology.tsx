import React from 'react'
import CollectionsListService, {
  ALL_COLLECTIONS_ID,
  UNASSIGNED_COLLECTION_ID,
} from '../../data/db/CollectionsListService'
import HistoryEventsListService from '../../data/db/HistoryEventsListService'
import LocationListService from '../../data/db/LocationListService'
import PeopleListService from '../../data/db/PeopleListService'
import PersonReferenceListService from '../../data/db/PersonReferenceListService'
import PublicationReferenceListService from '../../data/db/PublicationReferenceListService'
import PeopleHistoryEventsListService from '../../data/db/PeopleHistoryEventsListService'
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
import LocationDetails from '../location/LocationDetails'
import PersonDetails from '../person/PersonDetails'
import PersonHistoryEventDetails from '../personHistoryEvents/PersonHistoryEventDetails'
import PublicationDetails from '../publication/PublicationDetails'
import Menu from '../ui/Menu'

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
    setHistoryEvents(HistoryEventsListService.getAll().filter(itemsFilter(c => c.includedEvents)))
    setPublicationsList(PublicationsListService.getAll().filter(itemsFilter(c => c.includedPublications)))
    setPublicationReferenceList(PublicationReferenceListService.getAll().filter(itemsFilter(c => c.includedReferences)))
    setPeopleReferenceList(PersonReferenceListService.getAll().filter(itemsFilter(c => c.includedPeopleRelations)))
    const visiblePersonIds = new Set(filteredPeople.map(p => p.id))
    setPeopleHistoryEvents(PeopleHistoryEventsListService.getAll().filter(e => visiblePersonIds.has(e.personId)))
  }

  const selectCollection = (collectionId: string) => {
    const newCollectionsState = collectionsState.map((c: Collection) => ({
      ...c,
      isActive: c.id === collectionId,
    }))
    setCollectionsState(newCollectionsState)
    applyCollectionFilter(collectionId, newCollectionsState)
  }

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

  const [zoom, setZoom] = React.useState(10)
  const [highlightedAuthor, updateHighlightedAuthor] = React.useState('0')
  const [currentPublication, setCurrentPublication] = React.useState<Publication>(new Publication('', '', 0, 0, '', ''))
  const [currentAuthor, setCurrentAuthor] = React.useState(new Person('', '', 0, 0, true, '', '', '', 1, '', ''))
  const [currentPersonHistoryEvent, setCurrentPersonHistoryEvent] = React.useState<PersonHistoryEvent>(
    new PersonHistoryEvent('', '', '', '', null, null, null),
  )
  const [highlightedPublication, updateHighlightedPublication] = React.useState('0')
  const [viewPosition, setPosition] = React.useState({
    x: 1588,
    y: 0,
  })
  const [yearSelection, setYearSelection] = React.useState({
    from: -1200,
    stepSize: 100,
    to: 2101,
  })

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDisplayPublicationModal(false)
        setDisplayLocationModal(false)
        setDisplayPersonModal(false)
        setDisplayPersonHistoryEventModal(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const darkModeEventHandler = (event: MediaQueryListEvent) => {
      setDarkMode(event.matches)
    }
    darkModeMediaQuery.addEventListener('change', darkModeEventHandler)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      darkModeMediaQuery.removeEventListener('change', darkModeEventHandler)
    }
  }, [])

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
        peopleHistoryEvents={peopleHistoryEvents}
        peopleList={peopleList}
        peopleReferenceList={peopleReferenceList}
        publicationReferenceList={publicationReferenceList}
        publicationsList={publicationsList}
        rowHeight={prop.rowHeight}
        setPosition={setPosition}
        setYearSelection={setYearSelection}
        setZoom={setZoom}
        updateHighlightedAuthor={updateHighlightedAuthor}
        updateHighlightedPublication={updateHighlightedPublication}
        viewPosition={viewPosition}
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
          setDarkMode={setDarkMode}
          setDisplayAuthorRelations={setDisplayAuthorRelations}
          setDisplayAuthors={setDisplayAuthors}
          setDisplayAuthorsTimeline={setDisplayAuthorsTimeline}
          setDisplayHistoryEvents={setDisplayHistoryEvents}
          setDisplayPersonHistoryEvents={setDisplayPersonHistoryEvents}
          setDisplayPublicationRelations={setDisplayPublicationRelations}
          setDisplayPublications={setDisplayPublications}
          selectCollection={selectCollection}
        />
      </div>

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
        displayModal={displayPersonHistoryEventModal}
        locationCallback={id => {
          setCurrentLocation(LocationListService.getById(id)!)
          setDisplayLocationModal(true)
          setDisplayPublicationModal(false)
          setDisplayPersonHistoryEventModal(false)
          setDisplayPersonModal(false)
        }}
        personCallback={id => {
          setCurrentAuthor(peopleList.find(p => p.id === id)!)
          setDisplayPersonModal(true)
          setDisplayLocationModal(false)
          setDisplayPublicationModal(false)
          setDisplayPersonHistoryEventModal(false)
        }}
        setDisplayModal={setDisplayPersonHistoryEventModal}
      />

      <LocationDetails
        authorCallback={id => {
          setCurrentAuthor(peopleList.find(p => p.id === id)!)
          setDisplayPersonModal(true)
          setDisplayLocationModal(false)
          setDisplayPublicationModal(false)
          setDisplayPersonHistoryEventModal(false)
        }}
        currentLocation={currentLocation}
        displayModal={displayLocationModal}
        peopleList={peopleList}
        publicationCallback={id => {
          setCurrentPublication(publicationsList.find(p => p.id === id)!)
          setDisplayPublicationModal(true)
          setDisplayLocationModal(false)
          setDisplayPersonModal(false)
          setDisplayPersonHistoryEventModal(false)
        }}
        setDisplayModal={setDisplayLocationModal}
      />

      <PersonDetails
        currentPerson={currentAuthor}
        displayModal={displayPersonModal}
        locationCallback={id => {
          setCurrentLocation(locationsList.find(l => l.id === id)!)
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
          setCurrentPublication(publicationsList.find(p => p.id === id)!)
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
