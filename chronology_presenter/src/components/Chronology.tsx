import './Chronology.css';
import useWindowDimensions from '../useWindowDimensions';
import React from 'react';

class Coords {
  constructor(
    public x: number,
    public y: number,
  ) {}
}

class YearSelection {
  constructor(
    public from: number,
    public to: number,
    public stepSize: number,
  ) {}
}

class ChronologyProperies {
  constructor(
    public gapBetweenYears: number,
    public windowSize: Coords,
    public yearSelection: YearSelection,
  ) {}
}

const Chronology = () => {
  const dimenstions = useWindowDimensions();

  const [zoom, setZoom] = React.useState(1);
  const [isDragged, setDrag] = React.useState(false);
  const [viewPosition, setPosition] = React.useState({
    x: -1200,
    y: 0,
  });
  const prop: ChronologyProperies = {
    gapBetweenYears: 200,
    windowSize: {
      x: dimenstions.width,
      y: dimenstions.height,
    },
    yearSelection: {
      from: -1200,
      to: 2025,
      stepSize: 100,
    },
  };

  const originalWidth = prop.windowSize.x;
  const originalHeight = prop.windowSize.y;

  const yearsOnScale = [
    ...Array(
      Math.ceil(
        (prop.yearSelection.to - prop.yearSelection.from) /
          prop.yearSelection.stepSize,
      ),
    ),
  ].map((_, i) => prop.yearSelection.from + i * prop.yearSelection.stepSize);

  return (
    <div
      style={{
        backgroundColor: '#f3f3f3',
        width: prop.windowSize.x,
        height: prop.windowSize.y,
        overflow: 'hidden',
      }}
      //   draggable="true"
      //   onDrag={(e) => console.log(e)}
      onMouseDown={(e) => setDrag(true)}
      onMouseUp={(e) => setDrag(false)}
      onMouseMove={(e) => {
        if (isDragged) {
          setPosition({ x: viewPosition.x - 1, y: viewPosition.y });
        }
      }}
      onWheel={(e) => setZoom(zoom + e.deltaY / 5000)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${originalWidth} ${originalHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: prop.windowSize.x, height: prop.windowSize.y }}
      >
        <rect x="0" y="0" rx="10" ry="10" width="30" height="30" />
        <rect
          x={prop.windowSize.x - 30}
          y={prop.windowSize.y - 30}
          rx="10"
          ry="10"
          width="30"
          height="30"
        />
      </svg>
      <div className={'scaleContainer'}>
        <div className={'scale'}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${originalWidth} 60`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: prop.windowSize.x, height: 60 }}
          >
            {yearsOnScale.map((year, index): any => {
              return (
                <g>
                  <rect
                    x={
                      index * zoom * prop.gapBetweenYears +
                      viewPosition.x -
                      prop.yearSelection.from
                    }
                    y="30"
                    rx="5"
                    ry="5"
                    width="100"
                    height="40"
                    fill="#eeeeee"
                  ></rect>
                  <text
                    x={
                      index * zoom * prop.gapBetweenYears +
                      viewPosition.x -
                      prop.yearSelection.from +
                      20
                    }
                    y="55"
                    width="100"
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
