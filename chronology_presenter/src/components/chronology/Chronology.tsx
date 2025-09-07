import './Chronology.css';
import useWindowDimensions from '../../useWindowDimensions';
import React from 'react';
import ChronologyPad from './ChronologyPad';
import ChronologyScale from './ChronologyScale';
import { PersonNodeSettings } from '../person/PersonNode';
import { PublicationNodeSettings } from '../publication/PublicationNode';
import PublicationsList from '../publication/PublicationsList';
import { PublicationReferenceSettings } from '../publicationReference/PublicationReferenceNode';
import Coordinates from '../../geometry/Coordinates';
import PeopleList from '../person/PeopleList';
import PublicationReferencesList from '../publicationReference/publicationReferencesList';

class ChronologyProperies {
  constructor(
    public windowSize: Coordinates,
    public yearLabelWidth: number,
    public rowHeight: number,
  ) {}
}

const Chronology = () => {
  const dimenstions = useWindowDimensions();
  const prop: ChronologyProperies = {
    windowSize: {
      x: dimenstions.width,
      y: dimenstions.height,
    },
    yearLabelWidth: 100,
    rowHeight: 165,
  };

  const [zoom, setZoom] = React.useState(22);
  const [pinchDelta, setPinchDelta] = React.useState(0);
  const [drag, setDrag] = React.useState({
    isDragged: false,
    startViewPosition: { x: 0, y: 0 },
    startDragPosition: { x: 0, y: 0 },
  });
  const [highlightedAuthor, updateHighlightedAuthor] = React.useState('0');
  const [highlightedPublication, updateHighlightedPublication] =
    React.useState('0');
  const [viewPosition, setPosition] = React.useState({ x: 1809, y: 0 });
  const [yearSelection, setYearSelection] = React.useState({
    from: -1200,
    to: 2025,
    stepSize: 10,
  });

  const personNodesSettings: PersonNodeSettings = {
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
    boxSize: 50,
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
        // executePageDrag(e.touches[0].pageX, e.touches[0].pageY);

        let pinchSize: number = calculateDelta(
          touches[0].pageX,
          touches[0].pageY,
          touches[1].pageX,
          touches[1].pageY,
        );
        setZoom(zoom - (pinchDelta - pinchSize) / 200);
        setPinchDelta(pinchSize);

        if (zoom <= 10) {
          setYearSelection((ys) => ({ ...ys, stepSize: 100 }));
        } else if (zoom <= 20) {
          setYearSelection((ys) => ({ ...ys, stepSize: 10 }));
        } else {
          setYearSelection((ys) => ({ ...ys, stepSize: 5 }));
        }

        setPosition({
          x: viewPosition.x - pinchSize / 100,
          y: viewPosition.y,
        });

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

  return (
    <div
      style={{
        backgroundColor: '#f3f3f3',
        width: prop.windowSize.x,
        height: prop.windowSize.y,
        overflow: 'hidden',
      }}
      onMouseDown={(e) => startPageDrag(e.button, e.pageX, e.pageY)}
      onTouchStart={(e) => multitouchStart(e.touches)}
      onMouseUp={(e) => stopPageDrag()}
      onTouchEnd={(e) => stopPageDrag()}
      onMouseMove={(e) => executePageDrag(e.pageX, e.pageY)}
      onTouchMove={(e) => multitouchMove(e.touches)}
      onWheel={(e) => mouseWheel(e.deltaY)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${prop.windowSize.x} ${prop.windowSize.y}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: prop.windowSize.x, height: prop.windowSize.y }}
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

        <PeopleList
          isVisibleRange={isVisible}
          personNodesSettings={personNodesSettings}
          positionByYear={positionByYear}
          rowPosition={rowPosition}
          updateHighlightedAuthor={updateHighlightedAuthor}
        />

        <PublicationReferencesList
          highlightedAuthor={highlightedAuthor}
          highlightedPublication={highlightedPublication}
          isVisibleRange={isVisibleRange}
          positionByYear={positionByYear}
          publicationReferenceSettings={publicationReferenceSettings}
          rowPosition={rowPosition}
        />

        <PublicationsList
          isVisible={isVisible}
          positionByYear={positionByYear}
          publicationNodeSettings={publicationNodeSettings}
          rowPosition={rowPosition}
          updateHighlightedPublication={updateHighlightedPublication}
        />
      </svg>

      <ChronologyScale
        padSize={new Coordinates(prop.windowSize.x, prop.windowSize.y)}
        isVisible={isVisible}
        positionByYear={positionByYear}
        yearLabelWidth={prop.yearLabelWidth}
        yearsOnScale={yearsOnScale}
      />
    </div>
  );
};

export default Chronology;
