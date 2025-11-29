import './Chronology.css'
import React from 'react'
import CollectionsListService from '../../data/db/CollectionsListService'
import HistoryEventsListService from '../../data/db/HistoryEventsListService'
import LocationListService from '../../data/db/LocationListService'
import PeopleListService from '../../data/db/PeopleListService'
import PersonReferenceListService from '../../data/db/PersonReferenceListService'
import PublicationReferenceListService from '../../data/db/PublicationReferenceListService'
import PublicationsListService from '../../data/db/PublicationsListService'
import type Collection from '../../data/dto/Collection'
import type HistoryEvent from '../../data/dto/HistoryEvent'
import Location from '../../data/dto/Location'
import Person from '../../data/dto/Person'
import type PersonReference from '../../data/dto/PersonReference'
import Publication from '../../data/dto/Publication'
import type PublicationReference from '../../data/dto/PublicationReference'
import Coordinates from '../../geometry/Coordinates'
import type { HistoryEventNodeSettings } from '../historyEvents/HistoryEventNode'
import HistoryEventsList from '../historyEvents/HistoryEventsList'
import LocationDetails from '../location/LocationDetails'
import PeopleList from '../person/PeopleList'
import PersonDetails from '../person/PersonDetails'
import type { PersonNodeSettings } from '../person/PersonNode'
import type { PersonReferenceSettings } from '../personReference/PersonReferenceNode'
import PersonReferencesList from '../personReference/PersonReferencesList'
import PublicationDetails from '../publication/PublicationDetails'
import type { PublicationNodeSettings } from '../publication/PublicationNode'
import PublicationsList from '../publication/PublicationsList'
import type { PublicationReferenceSettings } from '../publicationReference/PublicationReferenceNode'
import PublicationReferencesList from '../publicationReference/PublicationReferencesList'
import Menu from '../ui/Menu'
import ChronologyPad from './ChronologyPad'
import ChronologyScale from './ChronologyScale'

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
    rowHeight: 85,
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
  const [collectionsState, setCollectionsState] = React.useState<Collection[]>(CollectionsListService.getAll())
  interface HasId {
    id: string
  }
  const toggleCollectionsState = (collectionId: string, checked: boolean) => {
    const newCollectionsState = collectionsState.map((c: Collection) =>
      c.id === collectionId ? { ...c, isActive: checked } : c,
    )

    function itemsFilter<S extends HasId>(cmap: (collections: Collection) => number[]) {
      const includeUnassigned = newCollectionsState.find(cs => cs.id === '0')
      const isWhiteList: boolean = includeUnassigned?.isActive ?? false
      const includedIds: string[] = newCollectionsState
        .filter(c => c.isActive)
        .flatMap(cmap)
        .map(c => c + '')
      const allCollectionIds: string[] = newCollectionsState.flatMap(cmap).map(c => c + '')

      return (item: S, _: number) =>
        isWhiteList
          ? !allCollectionIds.includes(item.id) || includedIds.includes(item.id)
          : includedIds.includes(item.id)
    }

    setCollectionsState(newCollectionsState)

    setPeopleList(
      PeopleListService.withRowNumbers(PeopleListService.getAll().filter(itemsFilter(c => c.includedPeople))),
    )
    setLocationsList(LocationListService.getAll().filter(itemsFilter(c => c.includedLocations)))
    setHistoryEvents(HistoryEventsListService.getAll().filter(itemsFilter(c => c.includedEvents)))
    setPublicationsList(PublicationsListService.getAll().filter(itemsFilter(c => c.includedPublications)))
    setPublicationReferenceList(PublicationReferenceListService.getAll().filter(itemsFilter(c => c.includedReferences)))
    setPeopleReferenceList(PersonReferenceListService.getAll().filter(itemsFilter(c => c.includedPeopleRelations)))
  }

  const [displayPublicationModal, setDisplayPublicationModal] = React.useState<boolean>(false)
  const [displayLocationModal, setDisplayLocationModal] = React.useState<boolean>(false)
  const [displayPersonModal, setDisplayPersonModal] = React.useState<boolean>(false)
  const [currentLocation, setCurrentLocation] = React.useState(new Location('', '', new Coordinates(0, 0), ''))

  const [displayAuthors, setDisplayAuthors] = React.useState(true)
  const [displayAuthorsTimeline, setDisplayAuthorsTimeline] = React.useState(true)
  const [displayAuthorRelations, setDisplayAuthorRelations] = React.useState(true)
  const [displayPublications, setDisplayPublications] = React.useState(true)
  const [displayPublicationRelations, setDisplayPublicationRelations] = React.useState(true)
  const [displayHistoryEvents, setDisplayHistoryEvents] = React.useState(true)
  const [darkMode, setDarkMode] = React.useState(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  const [zoom, setZoom] = React.useState(10)
  const [pinchDelta, setPinchDelta] = React.useState(0)
  const [drag, setDrag] = React.useState({
    isDragged: false,
    startDragPosition: { x: 0, y: 0 },
    startViewPosition: { x: 0, y: 0 },
  })
  const [highlightedAuthor, updateHighlightedAuthor] = React.useState('0')
  const [currentPublication, setCurrentPublication] = React.useState(new Publication('', '', 0, 0, '', ''))
  const [currentAuthor, setCurrentAuthor] = React.useState(new Person('', '', 0, 0, true, '', '', '', 1, '', ''))
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

  const historyEventNodeSettings: HistoryEventNodeSettings = {
    boxSize: 20,
    rowHeight: 21,
  }

  const personNodesSettings: PersonNodeSettings = {
    boxSize: 50,
  }

  const personReferenceSettings: PersonReferenceSettings = {
    boxSize: 50,
  }

  const publicationNodeSettings: PublicationNodeSettings = {
    boxSize: 50,
    dotSize: 15,
    maxLettersColumns: 25,
    maxLettersRows: 3,
  }

  const publicationReferenceSettings: PublicationReferenceSettings = {
    boxSize: 30,
    dotSize: 15,
  }

  const yearsOnScale = [...Array(Math.ceil((yearSelection.to - yearSelection.from) / yearSelection.stepSize))].map(
    (_, i) => yearSelection.from + i * yearSelection.stepSize,
  )

  const positionByYear = (year: number) => (year - viewPosition.x) * zoom
  const isVisible = (year: number) =>
    positionByYear(year) + prop.rowHeight > 0 && positionByYear(year) - prop.rowHeight < prop.windowSize.x
  const isVisibleRange = (from: number, to: number) =>
    positionByYear(to) + prop.rowHeight > 0 && positionByYear(from) - prop.rowHeight < prop.windowSize.x
  const rowPosition = (rowNumber: number) => prop.rowHeight * rowNumber + viewPosition.y
  const historyEventRowPosition = (rowNumber: number) =>
    -historyEventNodeSettings.rowHeight * rowNumber + viewPosition.y

  const startPageDrag = (button: number, pageX: number, pageY: number) => {
    if (button === 0) {
      setDrag({
        isDragged: true,
        startDragPosition: { x: pageX, y: pageY },
        startViewPosition: viewPosition,
      })
    }
  }
  const stopPageDrag = () => setDrag(state => ({ ...state, isDragged: false }))
  const executePageDrag = (pageX: number, pageY: number) => {
    if (drag.isDragged) {
      setPosition({
        x: Math.min(
          Math.max(
            drag.startViewPosition.x - (pageX - drag.startDragPosition.x) / zoom,
            yearSelection.from - prop.yearLabelWidth,
          ),
          yearSelection.to + prop.yearLabelWidth,
        ),
        y: drag.startViewPosition.y + (pageY - drag.startDragPosition.y),
      })
    }
  }

  const calculateDelta = (x1: number, y1: number, x2: number, y2: number) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)

  const multitouchStart = (touches: React.TouchList) => {
    switch (touches.length) {
      case 1:
        startPageDrag(0, touches[0].pageX, touches[0].pageY)
        break
      case 2:
        startPageDrag(0, touches[0].pageX, touches[0].pageY)
        setPinchDelta(calculateDelta(touches[0].pageX, touches[0].pageY, touches[1].pageX, touches[1].pageY))
    }
  }

  const multitouchMove = (touches: React.TouchList) => {
    switch (touches.length) {
      case 1: {
        executePageDrag(touches[0].pageX, touches[0].pageY)
        break
      }
      case 2: {
        const pinchSize: number = calculateDelta(touches[0].pageX, touches[0].pageY, touches[1].pageX, touches[1].pageY)
        setZoom(zoom - (pinchDelta - pinchSize) / 100)
        setPinchDelta(pinchSize)

        if (zoom <= 10) {
          setYearSelection(ys => ({ ...ys, stepSize: 100 }))
        } else if (zoom <= 20) {
          setYearSelection(ys => ({ ...ys, stepSize: 10 }))
        } else {
          setYearSelection(ys => ({ ...ys, stepSize: 5 }))
        }

        stopPageDrag()
      }
    }
  }

  const mouseWheel = (deltaY: number) => {
    if (Math.max(1, zoom - deltaY / 100) <= 11.0) {
      setYearSelection(ys => ({ ...ys, stepSize: 100 }))
      setZoom(Math.max(1, zoom - deltaY / 100))
    } else if (zoom - deltaY / 200 <= 22.0) {
      setYearSelection(ys => ({ ...ys, stepSize: 10 }))
      setZoom(zoom - deltaY / 200)
    } else {
      setYearSelection(ys => ({ ...ys, stepSize: 5 }))
      setZoom(zoom - deltaY / 300)
    }
    setPosition({
      x: viewPosition.x - deltaY / 100,
      y: viewPosition.y,
    })
  }
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDisplayPublicationModal(false)
        setDisplayLocationModal(false)
        setDisplayPersonModal(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const darkModeEventHandler = (event: any) => {
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
        width: prop.windowSize.x,
      }}
    >
      <svg
        onMouseDown={e => startPageDrag(e.button, e.pageX, e.pageY)}
        onMouseMove={e => executePageDrag(e.pageX, e.pageY)}
        onMouseUp={_ => stopPageDrag()}
        onTouchEnd={_ => stopPageDrag()}
        onTouchMove={e => multitouchMove(e.touches)}
        onTouchStart={e => multitouchStart(e.touches)}
        onWheel={e => mouseWheel(e.deltaY)}
        preserveAspectRatio="xMidYMid meet"
        style={{
          cursor: drag.isDragged ? 'grabbing' : 'grab',
          height: prop.windowSize.y,
          width: prop.windowSize.x,
        }}
        viewBox={`0 0 ${prop.windowSize.x} ${prop.windowSize.y}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Chronology</title>
        {displayHistoryEvents && (
          <HistoryEventsList
            darkMode={darkMode}
            historyEventNodeSettings={historyEventNodeSettings}
            historyEvents={historyEvents}
            isVisibleRange={isVisibleRange}
            positionByYear={positionByYear}
            rowPosition={historyEventRowPosition}
          />
        )}

        <ChronologyPad
          isVisible={isVisible}
          padSize={new Coordinates(prop.windowSize.x, prop.windowSize.y)}
          positionByYear={positionByYear}
          stateResetHandler={() => {
            updateHighlightedPublication('0')
            updateHighlightedAuthor('0')
          }}
          yearsOnScale={yearsOnScale}
        />

        {displayAuthorRelations && displayAuthors && (
          <PersonReferencesList
            highlightedAuthor={highlightedAuthor}
            isVisibleRange={isVisibleRange}
            peopleList={peopleList}
            peopleReferenceList={peopleReferenceList}
            personReferenceSettings={personReferenceSettings}
            positionByYear={positionByYear}
            rowPosition={rowPosition}
          />
        )}

        {displayAuthors && (
          <PeopleList
            authorCallback={id => {
              setCurrentAuthor(peopleList.find(p => p.id === id)!)
              setDisplayLocationModal(false)
              setDisplayPublicationModal(false)
              setDisplayPersonModal(true)
            }}
            displayAuthorsTimeline={displayAuthorsTimeline}
            highlightedAuthor={highlightedAuthor}
            isVisibleRange={isVisibleRange}
            peopleList={peopleList}
            personNodesSettings={personNodesSettings}
            positionByYear={positionByYear}
            rowPosition={rowPosition}
            updateHighlightedAuthor={updateHighlightedAuthor}
          />
        )}

        {displayPublicationRelations && displayPublications && (
          <PublicationReferencesList
            highlightedAuthor={highlightedAuthor}
            highlightedPublication={highlightedPublication}
            isVisibleRange={isVisibleRange}
            peopleList={peopleList}
            positionByYear={positionByYear}
            publicationReferenceList={publicationReferenceList}
            publicationReferenceSettings={publicationReferenceSettings}
            publicationsList={publicationsList}
            rowPosition={rowPosition}
          />
        )}

        {displayPublications && (
          <PublicationsList
            isVisible={isVisible}
            modalHandle={setDisplayPublicationModal}
            peopleList={peopleList}
            positionByYear={positionByYear}
            publicationNodeSettings={publicationNodeSettings}
            publicationsList={publicationsList}
            rowPosition={rowPosition}
            setCurrentAuthor={setCurrentAuthor}
            setCurrentPublication={setCurrentPublication}
            updateHighlightedPublication={updateHighlightedPublication}
          />
        )}
      </svg>

      <ChronologyScale
        isVisible={isVisible}
        padSize={new Coordinates(prop.windowSize.x, prop.windowSize.y)}
        positionByYear={positionByYear}
        yearLabelWidth={prop.yearLabelWidth}
        yearsOnScale={yearsOnScale}
      />

      <Menu
        collectionsState={collectionsState}
        darkMode={darkMode}
        displayAuthorRelations={displayAuthorRelations}
        displayAuthors={displayAuthors}
        displayAuthorsTimeline={displayAuthorsTimeline}
        displayHistoryEvents={displayHistoryEvents}
        displayPublicationRelations={displayPublicationRelations}
        displayPublications={displayPublications}
        setDarkMode={setDarkMode}
        setDisplayAuthorRelations={setDisplayAuthorRelations}
        setDisplayAuthors={setDisplayAuthors}
        setDisplayAuthorsTimeline={setDisplayAuthorsTimeline}
        setDisplayHistoryEvents={setDisplayHistoryEvents}
        setDisplayPublicationRelations={setDisplayPublicationRelations}
        setDisplayPublications={setDisplayPublications}
        toggleCollectionsState={toggleCollectionsState}
      />

      <PublicationDetails
        authorCallback={id => {
          setCurrentAuthor(peopleList.find(p => p.id === id)!)
          setDisplayLocationModal(false)
          setDisplayPublicationModal(false)
          setDisplayPersonModal(true)
        }}
        currentAuthor={currentAuthor}
        currentPublication={currentPublication}
        displayModal={displayPublicationModal}
        locationCallback={id => {
          setCurrentLocation(LocationListService.getById(id)!)
          setDisplayLocationModal(true)
          setDisplayPublicationModal(false)
          setDisplayPersonModal(false)
        }}
        locationsList={locationsList}
        setDisplayModal={setDisplayPublicationModal}
      />

      <LocationDetails
        authorCallback={id => {
          setCurrentAuthor(peopleList.find(p => p.id === id)!)
          setDisplayPersonModal(true)
          setDisplayLocationModal(false)
          setDisplayPublicationModal(false)
        }}
        currentLocation={currentLocation}
        displayModal={displayLocationModal}
        peopleList={peopleList}
        publicationCallback={id => {
          setCurrentPublication(publicationsList.find(p => p.id === id)!)
          setDisplayPublicationModal(true)
          setDisplayLocationModal(false)
          setDisplayPersonModal(false)
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
        }}
        publicationCallback={id => {
          setCurrentPublication(publicationsList.find(p => p.id === id)!)
          setDisplayPublicationModal(true)
          setDisplayPersonModal(false)
          setDisplayLocationModal(false)
        }}
        setDisplayModal={setDisplayPersonModal}
      />
    </div>
  )
}

export default Chronology
