import './Chronology.css';
import useWindowDimensions from '../../useWindowDimensions';
import React from 'react';
import TimeScaleLine from '../timescale/TimeScaleLine';
import TimeScaleLabel from '../timescale/TimeScaleLabel';
import PeopleList from '../../data/db/PeopleList';
import { PersonNode, PersonNodeSettings } from '../person/PersonNode';
import PublicationsList, {
  getPublicationAuthor,
} from '../../data/db/PublicationsList';
import PublicationNode, {
  PublicationNodeSettings,
} from '../person/PublicationNode';

class Coords {
  constructor(
    public x: number,
    public y: number,
  ) {}
}

class ChronologyProperies {
  constructor(
    public windowSize: Coords,
    public yearLabelWidth: number,
    public rowHeight: number,
  ) {}
}

const Chronology = () => {
  const dimenstions = useWindowDimensions();

  const [zoom, setZoom] = React.useState(15);
  const [drag, setDrag] = React.useState({
    isDragged: false,
    startViewPosition: { x: 0, y: 0 },
    startDragPosition: { x: 0, y: 0 },
  });
  const [viewPosition, setPosition] = React.useState({ x: 1785, y: 0 });
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
            startPageDrag(0, e.touches[1].pageX, e.touches[1].pageY);
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
            startPageDrag(0, e.touches[1].clientX, e.touches[1].clientY);

            let delta =
              e.touches[1].clientX -
              drag.startDragPosition.x +
              (e.touches[1].clientY - drag.startDragPosition.y);

            setZoom(zoom - delta / 600);
            setYearSelection((ys) => ({ ...ys, stepSize: 5 }));

            break;
        }
      }}
      onWheel={(e) => {
        if (zoom <= 10) {
          setZoom(Math.max(1, zoom - e.deltaY / 200));
          setYearSelection((ys) => ({ ...ys, stepSize: 100 }));
        } else if (zoom <= 20) {
          setZoom(zoom - e.deltaY / 400);
          setYearSelection((ys) => ({ ...ys, stepSize: 10 }));
        } else {
          setZoom(zoom - e.deltaY / 600);
          setYearSelection((ys) => ({ ...ys, stepSize: 5 }));
        }
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${prop.windowSize.x} ${prop.windowSize.y}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: prop.windowSize.x, height: prop.windowSize.y }}
      >
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
          />
        ))}
        {PublicationsList.filter((publication) =>
          isVisible(publication.publicationDate),
        )
          .map((publication, i) => ({
            publication,
            author: getPublicationAuthor(publication),
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
