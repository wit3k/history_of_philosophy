import './Chronology.css';
import React from 'react';
import ChronologyPad from './ChronologyPad';
import ChronologyScale from './ChronologyScale';
import { PersonNodeSettings } from '../person/PersonNode';
import { PublicationNodeSettings } from '../publication/PublicationNode';
import PublicationsList from '../publication/PublicationsList';
import { PublicationReferenceSettings } from '../publicationReference/PublicationReferenceNode';
import Coordinates from '../../geometry/Coordinates';
import PeopleList from '../person/PeopleList';
import PublicationReferencesList from '../publicationReference/PublicationReferencesList';
import PersonReferencesList from '../personReference/PersonReferencesList';
import type { PersonReferenceSettings } from '../personReference/PersonReferenceNode';
import Menu from '../ui/Menu';
import PublicationDetails from '../publication/PublicationDetails';
import Publication from '../../data/dto/Publication';
import Person from '../../data/dto/Person';
import PeopleListService from '../../data/db/PeopleListService';
import LocationDetails from '../location/LocationDetails';
import Location from '../../data/dto/Location';
import LocationListService from '../../data/db/LocationListService';

class ChronologyProperies {
  constructor(
    public windowSize: Coordinates,
    public yearLabelWidth: number,
    public rowHeight: number,
  ) {}
}

const Chronology = () => {
  const hasWindow = typeof window !== 'undefined';

  const getWindowDimensions = () => ({
    x: hasWindow ? window.innerWidth : 0,
    y: hasWindow ? window.innerHeight : 0,
  });

  const [dimenstions, setWindowDimensions] = React.useState(
    getWindowDimensions(),
  );

  React.useEffect(() => {
    if (hasWindow) {
      function handleResize() {
        setWindowDimensions(getWindowDimensions());
      }

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [hasWindow]);

  const prop: ChronologyProperies = {
    windowSize: dimenstions,
    yearLabelWidth: 100,
    rowHeight: 85,
  };

  const [displayPublicationModal, setDisplayPublicationModal] =
    React.useState<boolean>(false);
  const [displayLocationModal, setDisplayLocationModal] =
    React.useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = React.useState(
    new Location('', '', new Coordinates(0, 0), ''),
  );

  const [displayAuthors, setDisplayAuthors] = React.useState(true);
  const [displayAuthorsTimeline, setDisplayAuthorsTimeline] =
    React.useState(true);
  const [displayAuthorRelations, setDisplayAuthorRelations] =
    React.useState(true);
  const [displayPublications, setDisplayPublications] = React.useState(true);
  const [displayPublicationRelations, setDisplayPublicationRelations] =
    React.useState(true);

  const [zoom, setZoom] = React.useState(3);
  const [pinchDelta, setPinchDelta] = React.useState(0);
  const [drag, setDrag] = React.useState({
    isDragged: false,
    startViewPosition: { x: 0, y: 0 },
    startDragPosition: { x: 0, y: 0 },
  });
  const [highlightedAuthor, updateHighlightedAuthor] = React.useState('0');
  const [currentPublication, setCurrentPublication] = React.useState(
    new Publication(
      '',
      '',
      0,
      new Location('', '', new Coordinates(0, 0), ''),
      '',
      '',
    ),
  );
  const [currentAuthor, setCurrentAuthor] = React.useState(
    new Person('', '', 0, 0, 1, ''),
  );
  const [highlightedPublication, updateHighlightedPublication] =
    React.useState('0');
  const [viewPosition, setPosition] = React.useState({
    x: PeopleListService.startingPoint(),
    y: 0,
  });
  const [yearSelection, setYearSelection] = React.useState({
    from: -1200,
    to: 2101,
    stepSize: 100,
  });

  const personNodesSettings: PersonNodeSettings = {
    boxSize: 50,
  };

  const personReferenceSettings: PersonReferenceSettings = {
    boxSize: 50,
  };

  const publicationNodeSettings: PublicationNodeSettings = {
    dotSize: 15,
    boxSize: 50,
    maxLettersColumns: 25,
    maxLettersRows: 3,
  };

  const publicationReferenceSettings: PublicationReferenceSettings = {
    dotSize: 15,
    boxSize: 30,
  };

  const yearsOnScale = [
    ...Array(
      Math.ceil(
        (yearSelection.to - yearSelection.from) / yearSelection.stepSize,
      ),
    ),
  ].map((_, i) => yearSelection.from + i * yearSelection.stepSize);

  let positionByYear = (year: number) => (year - viewPosition.x) * zoom;
  let isVisible = (year: number) =>
    positionByYear(year) + prop.rowHeight > 0 &&
    positionByYear(year) - prop.rowHeight < prop.windowSize.x;
  let isVisibleRange = (from: number, to: number) =>
    positionByYear(to) + prop.rowHeight > 0 &&
    positionByYear(from) - prop.rowHeight < prop.windowSize.x;
  let rowPosition = (rowNumber: number) =>
    prop.rowHeight * rowNumber + viewPosition.y;

  let startPageDrag = (button: number, pageX: number, pageY: number) => {
    if (button == 0) {
      setDrag({
        isDragged: true,
        startViewPosition: viewPosition,
        startDragPosition: { x: pageX, y: pageY },
      });
    }
  };
  let stopPageDrag = () => setDrag((state) => ({ ...state, isDragged: false }));
  let executePageDrag = (pageX: number, pageY: number) => {
    if (drag.isDragged) {
      setPosition({
        x: Math.min(
          Math.max(
            drag.startViewPosition.x -
              (pageX - drag.startDragPosition.x) / zoom,
            yearSelection.from - prop.yearLabelWidth,
          ),
          yearSelection.to + prop.yearLabelWidth,
        ),
        y: drag.startViewPosition.y + (pageY - drag.startDragPosition.y),
      });
    }
  };

  let calculateDelta = (x1: number, y1: number, x2: number, y2: number) =>
    Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

  let multitouchStart = (touches: React.TouchList) => {
    switch (touches.length) {
      case 1:
        startPageDrag(0, touches[0].pageX, touches[0].pageY);
        break;
      case 2:
        startPageDrag(0, touches[0].pageX, touches[0].pageY);
        setPinchDelta(
          calculateDelta(
            touches[0].pageX,
            touches[0].pageY,
            touches[1].pageX,
            touches[1].pageY,
          ),
        );
    }
  };

  let multitouchMove = (touches: React.TouchList) => {
    switch (touches.length) {
      case 1:
        executePageDrag(touches[0].pageX, touches[0].pageY);
        break;
      case 2:
        let pinchSize: number = calculateDelta(
          touches[0].pageX,
          touches[0].pageY,
          touches[1].pageX,
          touches[1].pageY,
        );
        setZoom(zoom - (pinchDelta - pinchSize) / 100);
        setPinchDelta(pinchSize);

        if (zoom <= 10) {
          setYearSelection((ys) => ({ ...ys, stepSize: 100 }));
        } else if (zoom <= 20) {
          setYearSelection((ys) => ({ ...ys, stepSize: 10 }));
        } else {
          setYearSelection((ys) => ({ ...ys, stepSize: 5 }));
        }

        stopPageDrag();

        break;
    }
  };

  let mouseWheel = (deltaY: number) => {
    if (Math.max(1, zoom - deltaY / 100) <= 11.0) {
      setYearSelection((ys) => ({ ...ys, stepSize: 100 }));
      setZoom(Math.max(1, zoom - deltaY / 100));
    } else if (zoom - deltaY / 200 <= 22.0) {
      setYearSelection((ys) => ({ ...ys, stepSize: 10 }));
      setZoom(zoom - deltaY / 200);
    } else {
      setYearSelection((ys) => ({ ...ys, stepSize: 5 }));
      setZoom(zoom - deltaY / 300);
    }
    setPosition({
      x: viewPosition.x - deltaY / 100,
      y: viewPosition.y,
    });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setDisplayPublicationModal(false);
    }
  };
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div
      style={{
        background: 'rgba(8, 8, 11, 1)',
        width: prop.windowSize.x,
        height: prop.windowSize.y,
        overflow: 'hidden',
      }}
      onMouseDown={(e) => startPageDrag(e.button, e.pageX, e.pageY)}
      onTouchStart={(e) => multitouchStart(e.touches)}
      onMouseUp={(_) => stopPageDrag()}
      onTouchEnd={(_) => stopPageDrag()}
      onMouseMove={(e) => executePageDrag(e.pageX, e.pageY)}
      onTouchMove={(e) => multitouchMove(e.touches)}
      onWheel={(e) => mouseWheel(e.deltaY)}
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
      >
        <ChronologyPad
          padSize={new Coordinates(prop.windowSize.x, prop.windowSize.y)}
          isVisible={isVisible}
          positionByYear={positionByYear}
          stateResetHandler={() => {
            updateHighlightedPublication('0');
            updateHighlightedAuthor('0');
          }}
          yearsOnScale={yearsOnScale}
        />

        {displayAuthorRelations && displayAuthors && (
          <PersonReferencesList
            highlightedAuthor={highlightedAuthor}
            isVisibleRange={isVisibleRange}
            positionByYear={positionByYear}
            personReferenceSettings={personReferenceSettings}
            rowPosition={rowPosition}
          />
        )}

        {displayAuthors && (
          <PeopleList
            isVisibleRange={isVisibleRange}
            personNodesSettings={personNodesSettings}
            positionByYear={positionByYear}
            rowPosition={rowPosition}
            highlightedAuthor={highlightedAuthor}
            updateHighlightedAuthor={updateHighlightedAuthor}
            displayAuthorsTimeline={displayAuthorsTimeline}
          />
        )}

        {displayPublicationRelations && displayPublications && (
          <PublicationReferencesList
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
      />

      <PublicationDetails
        currentPublication={currentPublication}
        currentAuthor={currentAuthor}
        displayModal={displayPublicationModal}
        setDisplayModal={setDisplayPublicationModal}
        callback={(id) => {
          setCurrentLocation(LocationListService.getById(id)!);
          setDisplayLocationModal(true);
          setDisplayPublicationModal(false);
        }}
      />

      <LocationDetails
        currentLocation={currentLocation}
        displayModal={displayLocationModal}
        setDisplayModal={setDisplayLocationModal}
      />
    </div>
  );
};

export default Chronology;
