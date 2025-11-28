import './Chronology.css'
import React from 'react'
import ChronologyPad from './ChronologyPad'
import ChronologyScale from './ChronologyScale'
import Collection from '../../data/dto/Collection'
import CollectionsListService from '../../data/db/CollectionsListService'
import { PersonNodeSettings } from '../person/PersonNode'
import { PublicationNodeSettings } from '../publication/PublicationNode'
import PublicationsList from '../publication/PublicationsList'
import { PublicationReferenceSettings } from '../publicationReference/PublicationReferenceNode'
import Coordinates from '../../geometry/Coordinates'
import PeopleList from '../person/PeopleList'
import PublicationReferencesList from '../publicationReference/PublicationReferencesList'
import PersonReferencesList from '../personReference/PersonReferencesList'
import type { PersonReferenceSettings } from '../personReference/PersonReferenceNode'
import Menu from '../ui/Menu'
import PublicationDetails from '../publication/PublicationDetails'
import Publication from '../../data/dto/Publication'
import Person from '../../data/dto/Person'
import PeopleListService from '../../data/db/PeopleListService'
import LocationDetails from '../location/LocationDetails'
import Location from '../../data/dto/Location'
import LocationListService from '../../data/db/LocationListService'
import PublicationsListService from '../../data/db/PublicationsListService'
import PersonDetails from '../person/PersonDetails'
import PersonReferenceListService from '../../data/db/PersonReferenceListService'
import PublicationReferenceListService from '../../data/db/PublicationReferenceListService'
import type PersonReference from '../../data/dto/PersonReference'
import type PublicationReference from '../../data/dto/PublicationReference'
import HistoryEventsListService from '../../data/db/HistoryEventsListService'
import HistoryEvent from '../../data/dto/HistoryEvent'
import HistoryEventsList from '../historyEvents/HistoryEventsList'
import type { HistoryEventNodeSettings } from '../historyEvents/HistoryEventNode'

class ChronologyProperies {
  constructor(
    public windowSize: Coordinates,
    public yearLabelWidth: number,
    public rowHeight: number,
  ) {}
}

const Chronology = () => {
  const hasWindow = typeof window !== 'undefined'

  const getWindowDimensions = () => ({
    x: hasWindow ? window.innerWidth : 0,
    y: hasWindow ? window.innerHeight : 0,
  })

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
  }, [hasWindow])

  const prop: ChronologyProperies = {
    windowSize: dimenstions,
    yearLabelWidth: 100,
    rowHeight: 85,
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
      c.id == collectionId ? { ...c, isActive: checked } : c,
    )

    function itemsFilter<S extends HasId>(cmap: (collections: Collection) => number[]) {
      const includeUnassigned = newCollectionsState.find(cs => cs.id == '0')
      const isWhiteList: boolean = includeUnassigned != undefined && includeUnassigned.isActive
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
  const [darkMode, setDarkMode] = React.useState(true)

  const [zoom, setZoom] = React.useState(10)
  const [pinchDelta, setPinchDelta] = React.useState(0)
  const [drag, setDrag] = React.useState({
    isDragged: false,
    startViewPosition: { x: 0, y: 0 },
    startDragPosition: { x: 0, y: 0 },
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
    to: 2101,
    stepSize: 100,
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
    dotSize: 15,
    boxSize: 50,
    maxLettersColumns: 25,
    maxLettersRows: 3,
  }

  const publicationReferenceSettings: PublicationReferenceSettings = {
    dotSize: 15,
    boxSize: 30,
  }

  const yearsOnScale = [...Array(Math.ceil((yearSelection.to - yearSelection.from) / yearSelection.stepSize))].map(
    (_, i) => yearSelection.from + i * yearSelection.stepSize,
  )

  let positionByYear = (year: number) => (year - viewPosition.x) * zoom
  let isVisible = (year: number) =>
    positionByYear(year) + prop.rowHeight > 0 && positionByYear(year) - prop.rowHeight < prop.windowSize.x
  let isVisibleRange = (from: number, to: number) =>
    positionByYear(to) + prop.rowHeight > 0 && positionByYear(from) - prop.rowHeight < prop.windowSize.x
  let rowPosition = (rowNumber: number) => prop.rowHeight * rowNumber + viewPosition.y
  let historyEventRowPosition = (rowNumber: number) => -historyEventNodeSettings.rowHeight * rowNumber + viewPosition.y

  let startPageDrag = (button: number, pageX: number, pageY: number) => {
    if (button == 0) {
      setDrag({
        isDragged: true,
        startViewPosition: viewPosition,
        startDragPosition: { x: pageX, y: pageY },
      })
    }
  }
  let stopPageDrag = () => setDrag(state => ({ ...state, isDragged: false }))
  let executePageDrag = (pageX: number, pageY: number) => {
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

  let calculateDelta = (x1: number, y1: number, x2: number, y2: number) =>
    Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))

  let multitouchStart = (touches: React.TouchList) => {
    switch (touches.length) {
      case 1:
        startPageDrag(0, touches[0].pageX, touches[0].pageY)
        break
      case 2:
        startPageDrag(0, touches[0].pageX, touches[0].pageY)
        setPinchDelta(calculateDelta(touches[0].pageX, touches[0].pageY, touches[1].pageX, touches[1].pageY))
    }
  }

  let multitouchMove = (touches: React.TouchList) => {
    switch (touches.length) {
      case 1:
        executePageDrag(touches[0].pageX, touches[0].pageY)
        break
      case 2:
        let pinchSize: number = calculateDelta(touches[0].pageX, touches[0].pageY, touches[1].pageX, touches[1].pageY)
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

        break
    }
  }

  let mouseWheel = (deltaY: number) => {
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

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setDisplayPublicationModal(false)
      setDisplayLocationModal(false)
      setDisplayPersonModal(false)
    }
  }
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div
      style={{
        background: darkMode ? 'rgb(43, 44, 45)' : 'white',
        width: prop.windowSize.x,
        height: prop.windowSize.y,
        overflow: 'hidden',
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${prop.windowSize.x} ${prop.windowSize.y}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          width: prop.windowSize.x,
          height: prop.windowSize.y,
          cursor: drag.isDragged ? 'grabbing' : 'grab',
        }}
        onMouseDown={e => startPageDrag(e.button, e.pageX, e.pageY)}
        onTouchStart={e => multitouchStart(e.touches)}
        onMouseUp={_ => stopPageDrag()}
        onTouchEnd={_ => stopPageDrag()}
        onMouseMove={e => executePageDrag(e.pageX, e.pageY)}
        onTouchMove={e => multitouchMove(e.touches)}
        onWheel={e => mouseWheel(e.deltaY)}
      >
        {displayHistoryEvents && (
          <HistoryEventsList
            historyEvents={historyEvents}
            isVisibleRange={isVisibleRange}
            positionByYear={positionByYear}
            rowPosition={historyEventRowPosition}
            historyEventNodeSettings={historyEventNodeSettings}
            darkMode={darkMode}
          />
        )}

        <ChronologyPad
          padSize={new Coordinates(prop.windowSize.x, prop.windowSize.y)}
          isVisible={isVisible}
          positionByYear={positionByYear}
          stateResetHandler={() => {
            updateHighlightedPublication('0')
            updateHighlightedAuthor('0')
          }}
          yearsOnScale={yearsOnScale}
        />

        {displayAuthorRelations && displayAuthors && (
          <PersonReferencesList
            peopleList={peopleList}
            peopleReferenceList={peopleReferenceList}
            highlightedAuthor={highlightedAuthor}
            isVisibleRange={isVisibleRange}
            positionByYear={positionByYear}
            personReferenceSettings={personReferenceSettings}
            rowPosition={rowPosition}
          />
        )}

        {displayAuthors && (
          <PeopleList
            peopleList={peopleList}
            isVisibleRange={isVisibleRange}
            personNodesSettings={personNodesSettings}
            positionByYear={positionByYear}
            rowPosition={rowPosition}
            highlightedAuthor={highlightedAuthor}
            updateHighlightedAuthor={updateHighlightedAuthor}
            displayAuthorsTimeline={displayAuthorsTimeline}
            authorCallback={id => {
              setCurrentAuthor(peopleList.find(p => p.id == id)!)
              setDisplayLocationModal(false)
              setDisplayPublicationModal(false)
              setDisplayPersonModal(true)
            }}
          />
        )}

        {displayPublicationRelations && displayPublications && (
          <PublicationReferencesList
            peopleList={peopleList}
            publicationReferenceList={publicationReferenceList}
            publicationsList={publicationsList}
            highlightedAuthor={highlightedAuthor}
            highlightedPublication={highlightedPublication}
            isVisibleRange={isVisibleRange}
            positionByYear={positionByYear}
            publicationReferenceSettings={publicationReferenceSettings}
            rowPosition={rowPosition}
          />
        )}

        {displayPublications && (
          <PublicationsList
            publicationsList={publicationsList}
            peopleList={peopleList}
            isVisible={isVisible}
            positionByYear={positionByYear}
            publicationNodeSettings={publicationNodeSettings}
            rowPosition={rowPosition}
            setCurrentAuthor={setCurrentAuthor}
            setCurrentPublication={setCurrentPublication}
            updateHighlightedPublication={updateHighlightedPublication}
            modalHandle={setDisplayPublicationModal}
          />
        )}
      </svg>

      <ChronologyScale
        padSize={new Coordinates(prop.windowSize.x, prop.windowSize.y)}
        isVisible={isVisible}
        positionByYear={positionByYear}
        yearLabelWidth={prop.yearLabelWidth}
        yearsOnScale={yearsOnScale}
      />

      <Menu
        displayAuthors={displayAuthors}
        setDisplayAuthors={setDisplayAuthors}
        displayAuthorsTimeline={displayAuthorsTimeline}
        setDisplayAuthorsTimeline={setDisplayAuthorsTimeline}
        displayAuthorRelations={displayAuthorRelations}
        setDisplayAuthorRelations={setDisplayAuthorRelations}
        displayPublications={displayPublications}
        setDisplayPublications={setDisplayPublications}
        displayPublicationRelations={displayPublicationRelations}
        setDisplayPublicationRelations={setDisplayPublicationRelations}
        displayHistoryEvents={displayHistoryEvents}
        setDisplayHistoryEvents={setDisplayHistoryEvents}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        collectionsState={collectionsState}
        toggleCollectionsState={toggleCollectionsState}
      />

      <PublicationDetails
        locationsList={locationsList}
        currentPublication={currentPublication}
        currentAuthor={currentAuthor}
        displayModal={displayPublicationModal}
        setDisplayModal={setDisplayPublicationModal}
        locationCallback={id => {
          setCurrentLocation(LocationListService.getById(id)!)
          setDisplayLocationModal(true)
          setDisplayPublicationModal(false)
          setDisplayPersonModal(false)
        }}
        authorCallback={id => {
          setCurrentAuthor(peopleList.find(p => p.id == id)!)
          setDisplayLocationModal(false)
          setDisplayPublicationModal(false)
          setDisplayPersonModal(true)
        }}
      />

      <LocationDetails
        peopleList={peopleList}
        currentLocation={currentLocation}
        displayModal={displayLocationModal}
        setDisplayModal={setDisplayLocationModal}
        publicationCallback={id => {
          setCurrentPublication(publicationsList.find(p => p.id == id)!)
          setDisplayPublicationModal(true)
          setDisplayLocationModal(false)
          setDisplayPersonModal(false)
        }}
        authorCallback={id => {
          setCurrentAuthor(peopleList.find(p => p.id == id)!)
          setDisplayPersonModal(true)
          setDisplayLocationModal(false)
          setDisplayPublicationModal(false)
        }}
      />

      <PersonDetails
        currentPerson={currentAuthor}
        displayModal={displayPersonModal}
        setDisplayModal={setDisplayPersonModal}
        locationCallback={id => {
          setCurrentLocation(locationsList.find(l => l.id == id)!)
          setDisplayLocationModal(true)
          setDisplayPersonModal(false)
          setDisplayPublicationModal(false)
        }}
        publicationCallback={id => {
          setCurrentPublication(publicationsList.find(p => p.id == id)!)
          setDisplayPublicationModal(true)
          setDisplayPersonModal(false)
          setDisplayLocationModal(false)
        }}
      />
    </div>
  )
}

export default Chronology
