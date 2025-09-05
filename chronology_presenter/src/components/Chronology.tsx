import './Chronology.css';
import useWindowDimensions from '../useWindowDimensions';
import React from 'react';

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
  ) {}
}

const Chronology = () => {
  const dimenstions = useWindowDimensions();

  const [zoom, setZoom] = React.useState(5);
  const [drag, setDrag] = React.useState({
    isDragged: false,
    startViewPosition: { x: 0, y: 0 },
    startDragPosition: { x: 0, y: 0 },
  });
  const [viewPosition, setPosition] = React.useState({ x: 1200, y: 0 });
  const [yearSelection, setYearSelection] = React.useState({
    from: -1200,
    to: 2025,
    stepSize: 100,
  });

  const prop: ChronologyProperies = {
    windowSize: {
      x: dimenstions.width,
      y: dimenstions.height,
    },
    yearLabelWidth: 100,
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
    positionByYear(year) > 0 && positionByYear(year) < prop.windowSize.x;

  return (
    <div
      style={{
        backgroundColor: '#f3f3f3',
        width: prop.windowSize.x,
        height: prop.windowSize.y,
        overflow: 'hidden',
      }}
      onMouseDown={(e) => {
        if (e.button == 0) {
          setDrag({
            isDragged: true,
            startViewPosition: viewPosition,
            startDragPosition: { x: e.pageX, y: e.pageY },
          });
        }
      }}
      onMouseUp={(e) => setDrag((state) => ({ ...state, isDragged: false }))}
      onMouseMove={(e) => {
        if (drag.isDragged) {
          setPosition({
            x: Math.min(
              Math.max(
                drag.startViewPosition.x -
                  (e.pageX - drag.startDragPosition.x) / zoom,
                yearSelection.from - prop.yearLabelWidth,
              ),
              yearSelection.to + prop.yearLabelWidth,
            ),
            y:
              drag.startViewPosition.y -
              (e.pageY - drag.startDragPosition.y) / zoom,
          });
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
        {yearsOnScale.filter(isVisible).map((year, index): any => {
          return (
            <g key={`yearLine` + year}>
              <line
                x1={positionByYear(year)}
                y1="0"
                x2={positionByYear(year)}
                y2={prop.windowSize.y}
                stroke="#d9d9d9"
                strokeWidth={year % 100 ? '1' : '3'}
                strokeDasharray={year % 100 ? '4' : ''}
              />
            </g>
          );
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
            {yearsOnScale.filter(isVisible).map((year, index): any => {
              return (
                <g key={`yearLabel` + year}>
                  <rect
                    x={positionByYear(year) - prop.yearLabelWidth / 2}
                    y="30"
                    rx="5"
                    ry="5"
                    width={prop.yearLabelWidth}
                    height="40"
                    fill={year % 100 ? '#cecece' : '#eeeeee'}
                  ></rect>
                  <text
                    x={positionByYear(year)}
                    y="55"
                    width={prop.yearLabelWidth}
                    dominantBaseline="middle"
                    textAnchor="middle"
                    height="40"
                    fontFamily="Verdana"
                    fontSize="15"
                    fill="dark-grey"
                  >
                    {year}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Chronology;
