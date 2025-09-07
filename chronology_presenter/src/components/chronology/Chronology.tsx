import './Chronology.css';
import useWindowDimensions from '../../useWindowDimensions';
import React from 'react';
import TimeScaleLine from '../timescale/TimeScaleLine';
import TimeScaleLabel from '../timescale/TimeScaleLabel';
import PeopleList from '../../data/db/PeopleList';
import { PersonNode, PersonNodeSettings } from '../person/PersonNode';
import PublicationsList, {
  PublicationsListService,
} from '../../data/db/PublicationsList';
import PublicationNode, {
  PublicationNodeSettings,
} from '../person/PublicationNode';
import PublicationReferenceList from '../../data/db/PublicationReferenceList';
import {
  PublicationReferenceNode,
  PublicationReferenceSettings,
} from '../person/PublicationReferenceNode';
import type Coordinates from '../../geometry/Coordinates';

class ChronologyProperies {
  constructor(
    public windowSize: Coordinates,
    public yearLabelWidth: number,
    public rowHeight: number,
  ) {}
}

const Chronology = () => {
  const dimenstions = useWindowDimensions();

  const [zoom, setZoom] = React.useState(22);
  const [pinchDelta, setPinchDelta] = React.useState(0);
  let calculateDelta = (x1: number, y1: number, x2: number, y2: number) =>
    Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
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
  };

  const publicationReferenceSettings: PublicationReferenceSettings = {
    dotSize: 15,
    boxSize: 50,
  };

  const prop: ChronologyProperies = {
    windowSize: {
      x: dimenstions.width,
      y: dimenstions.height,
    },
    yearLabelWidth: 100,
    rowHeight: 165,
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

  return (
    <div
      style={{
        backgroundColor: '#f3f3f3',
        width: prop.windowSize.x,
        height: prop.windowSize.y,
        overflow: 'hidden',
      }}
      onMouseDown={(e) => startPageDrag(e.button, e.pageX, e.pageY)}
      onTouchStart={(e) => {
        switch (e.touches.length) {
          case 1:
            startPageDrag(0, e.touches[0].pageX, e.touches[0].pageY);
            break;
          case 2:
            startPageDrag(0, e.touches[0].pageX, e.touches[0].pageY);
            setPinchDelta(
              calculateDelta(
                e.touches[0].pageX,
                e.touches[0].pageY,
                e.touches[1].pageX,
                e.touches[1].pageY,
              ),
            );
        }
      }}
      onMouseUp={(e) => stopPageDrag()}
      onTouchEnd={(e) => stopPageDrag()}
      onMouseMove={(e) => executePageDrag(e.pageX, e.pageY)}
      onTouchMove={(e) => {
        switch (e.touches.length) {
          case 1:
            executePageDrag(e.touches[0].pageX, e.touches[0].pageY);
            break;
          case 2:
            // executePageDrag(e.touches[0].pageX, e.touches[0].pageY);

            let pinchSize: number = calculateDelta(
              e.touches[0].pageX,
              e.touches[0].pageY,
              e.touches[1].pageX,
              e.touches[1].pageY,
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
      }}
      onWheel={(e) => {
        if (Math.max(1, zoom - e.deltaY / 100) <= 11.0) {
          setYearSelection((ys) => ({ ...ys, stepSize: 100 }));
          setZoom(Math.max(1, zoom - e.deltaY / 100));
        } else if (zoom - e.deltaY / 200 <= 22.0) {
          setYearSelection((ys) => ({ ...ys, stepSize: 10 }));
          setZoom(zoom - e.deltaY / 200);
        } else {
          setYearSelection((ys) => ({ ...ys, stepSize: 5 }));
          setZoom(zoom - e.deltaY / 300);
        }
        setPosition({
          x: viewPosition.x - e.deltaY / 100,
          y: viewPosition.y,
        });
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${prop.windowSize.x} ${prop.windowSize.y}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: prop.windowSize.x, height: prop.windowSize.y }}
      >
        <rect
          x="0%"
          y="0%"
          width={prop.windowSize.x}
          height={prop.windowSize.y}
          onClick={() => {
            updateHighlightedPublication('0');
            updateHighlightedAuthor('0');
          }}
          onMouseMove={() => {
            updateHighlightedPublication('0');
            updateHighlightedAuthor('0');
          }}
          style={{
            fill: 'white',
            stroke: 'none',
            strokeWidth: '0',
            fillOpacity: '0',
            strokeOpacity: '0',
          }}
        />
        {yearsOnScale.filter(isVisible).map((year, i) => (
          <TimeScaleLine
            year={year}
            height={prop.windowSize.y}
            position={positionByYear(year)}
            key={`yearLine` + year + i}
          />
        ))}

        {PeopleList.filter((person) =>
          isVisibleRange(person.born, person.died),
        ).map((person, i) => (
          <PersonNode
            key={'person' + person.id + i}
            person={person}
            positionStart={positionByYear(person.born)}
            positionEnd={positionByYear(person.died)}
            settings={personNodesSettings}
            rowPosition={rowPosition(person.rowNumber)}
            updateHighlightedAuthor={updateHighlightedAuthor}
          />
        ))}
        {PublicationReferenceList.map((reference, i) => {
          if (
            reference.from &&
            reference.to &&
            isVisibleRange(
              Math.min(
                reference.from?.publicationDate,
                reference.to?.publicationDate,
              ),
              Math.max(
                reference.from?.publicationDate,
                reference.to?.publicationDate,
              ),
            )
          ) {
            const authorFrom = PublicationsListService.getPublicationAuthor(
              reference.from,
            );
            const authorTo = PublicationsListService.getPublicationAuthor(
              reference.to,
            );
            if (authorFrom && authorTo) {
              return (
                <PublicationReferenceNode
                  key={'pubref' + reference.id + i}
                  publicationReference={reference}
                  settings={publicationReferenceSettings}
                  authorFrom={authorFrom}
                  authorTo={authorTo}
                  positionStart={positionByYear(reference.from.publicationDate)}
                  positionEnd={positionByYear(reference.to.publicationDate)}
                  rowPositionFrom={rowPosition(authorFrom.rowNumber)}
                  rowPositionTo={rowPosition(authorTo.rowNumber)}
                  isHighlighted={
                    highlightedAuthor == authorFrom.id ||
                    highlightedPublication == reference.from.id
                  }
                />
              );
            }
          }
        })}
        {PublicationsList.filter((publication) =>
          isVisible(publication.publicationDate),
        )
          .map((publication, _) => ({
            publication,
            author: PublicationsListService.getPublicationAuthor(publication),
          }))
          .map(({ publication, author }, i) => {
            if (author) {
              return (
                <PublicationNode
                  key={'publication' + publication.id + i}
                  publication={publication}
                  author={author}
                  position={positionByYear(publication.publicationDate)}
                  settings={publicationNodeSettings}
                  rowPosition={rowPosition(author.rowNumber)}
                  updateHighlightedPublication={updateHighlightedPublication}
                />
              );
            }
          })}
      </svg>
      <div className={'scaleContainer'}>
        <div className={'scale'}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${prop.windowSize.x} 60`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: prop.windowSize.x, height: 60 }}
          >
            {yearsOnScale.filter(isVisible).map((year, i) => (
              <TimeScaleLabel
                key={`yearLabel` + year + i}
                year={year}
                position={positionByYear(year)}
                yearLabelWidth={prop.yearLabelWidth}
              />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Chronology;
